const {generateUniqueToken} = require("../tokenUtils")
const APIError = require("../errors/APIError")
const db = require('../db')
const moment = require('moment-timezone')

class ThreadController {
    async createThread(req, res, next) {
        try {
            let threadID = await generateUniqueToken()

            const appToken = req.headers.authorization.split(' ')[1]

            let appID = null

            if (appToken) {
                console.log(appToken)
            }

            const currentTimeGMT = moment().tz('GMT').format('YYYY-MM-DD HH:mm:ss')

            const sql = "INSERT INTO `threads` (`app_id`, `thread_token`, `create_date`) VALUES (?, ?, ?)"

            const [result] = await db.query(sql, [appID, threadID, currentTimeGMT])

            if (result.affectedRows > 0 || result.insertId) {
                res.status(201).json({threadID: threadID})
            } else {
                return next(APIError.unprocessable('Failed to insert record into the database'))
            }
        } catch (err) {
            return next(APIError.internal("Internal server error: " + err))
        }
    }

    async showThread(req, res, next) {
        const sortComments = async (comments, parent_id = -1) => {
            try {
                const filteredComments = comments.filter(comment => comment.reply_to === parent_id)

                if (parent_id !== -1) {
                    filteredComments.sort((a, b) => {
                        const dateA = typeof a.date === 'string' ? a.date : a.date.toISOString()
                        const dateB = typeof b.date === 'string' ? b.date : b.date.toISOString()
                        return dateA.localeCompare(dateB)
                    })
                }

                const jsonComments = []

                for (const comment of filteredComments) {
                    if (comment.reply_to === parent_id) {
                        const jsonComment = {
                            id: comment.id,
                            page: comment.page,
                            user: {
                                id: comment.user_id
                            },
                            date: comment.date,
                            text: comment.text,
                            score: {
                                user_vote: comment.vote,
                                rating: parseInt(comment.rating, 10)
                            },
                            replies: await sortComments(comments, comment.id)
                        }

                        jsonComments.push(jsonComment)
                    }
                }

                return jsonComments
            } catch (err) {
                console.error('Error fetching comments:', err)
                return [{message: "Error fetching comments"}]
            }
        }

        try {
            const thread = await ThreadController.threadCheck(req, next)

            let sql = `
                SELECT c.*, IFNULL(SUM(cr.vote), 0) AS rating, cur.vote
                FROM comments c
                         LEFT JOIN ratings cr ON c.id = cr.comment_id
                         LEFT JOIN ratings cur ON c.id = cur.comment_id AND cur.user_id = ?
                WHERE c.thread_id = ?
            `

            const user_id = req.query.userID || null
            const page = req.query.page || null

            if (page !== null) {
                sql += ' AND c.page = ?'
            }

            sql += `
                GROUP BY id, cur.vote
                ORDER BY date DESC
            `

            let [result] = await db.query(sql, [
                user_id,
                thread.id,
                page
            ])

            if (result.length === 0) {
                return next(APIError.unprocessable('Failed to insert record into the database'))
            }

            const comments = await sortComments(result)

            res.status(200).json(comments)

        } catch (err) {
            return next(APIError.internal("Internal server error: " + err))
        }
    }

    async addComment(req, res, next) {
        try {
            const thread = await ThreadController.threadCheck(req, next);

            const reqBody = req.body;
            const { userID, text, reply_to } = reqBody;

            if (!userID || !text) {
                return next(APIError.badRequest("Missing required fields. Make sure 'user_id' and 'text' are provided."));
            }

            const replyTo = reply_to ? parseInt(reply_to, 10) : -1;
            const page = req.query.page || 1;

            const formReq = {
                "user_id": parseInt(userID, 10),
                "text": text,
                "reply_to": replyTo
            };

            const currentTimeGMT = moment().tz('GMT').format('YYYY-MM-DD HH:mm:ss');

            const insertSQL = "INSERT INTO `comments` (`thread_id`, `page`, `user_id`, `text`, `reply_to`, `date`) VALUES (?, ?, ?, ?, ?, ?)";
            const [result] = await db.query(insertSQL, [thread.id, page, formReq.user_id, formReq.text, formReq.reply_to, currentTimeGMT]);

            if (result.affectedRows > 0 || result.insertId) {
                res.status(201).json({ status: true, commentID: result.insertId });
            } else {
                return next(APIError.unprocessable('Failed to insert record into the database'));
            }
        } catch (err) {
            return next(APIError.internal("Internal server error: " + err));
        }
    }

    async delComment(req, res, next) {
        try {
            const thread = await ThreadController.threadCheck(req, next)
            const commentID = parseInt(req.params.commentID, 10)

            if (!commentID) {
                return next(APIError.badRequest("Missing required fields. Make sure 'comment_id' is provided."))
            }

            const deleteSQL = "DELETE FROM `comments` WHERE id = ? AND thread_id = ?"
            const [results] = await db.execute(deleteSQL, [commentID, thread.id])

            if (results.affectedRows > 0) {
                const deletedComments = []
                deletedComments.push(commentID)

                await ThreadController.recursiveDeleteComments(thread.id, commentID, deletedComments)

                res.status(200).json({ status: true, deletedIDs: deletedComments.reverse() })
            } else {
                return next(APIError.notFound("Comment not found!"))
            }
        } catch (err) {
            return next(APIError.internal("Internal server error: " + err))
        }
    }

    async editComment(req, res, next) {
        try {
            const thread = await ThreadController.threadCheck(req, next)

            const {commentID, threadID} = req.params
            const {text} = req.body

            if (!threadID || !commentID || !text) {
                return next(APIError.badRequest("Missing required fields or incorrect value for the 'vote' field."))
            }

            const editSQL = "UPDATE `comments` SET `text` = ? WHERE `id` = ? AND `thread_id` = ?"

            const [result] = await db.execute(editSQL, [text, commentID, thread.id])

            if (result.affectedRows > 0) {
                return res.status(200).json({status: true})
            } else {
                return next(APIError.notFound("Comment not found!"))
            }
        } catch (err) {
            return next(APIError.internal("Internal server error: " + err))
        }
    }

    async voteComment(req, res, next) {
        try {
            await ThreadController.threadCheck(req, next)

            const {commentID} = req.params
            const {userID, vote} = req.body

            if (!commentID || !userID || ![-1, 0, 1].includes(parseInt(vote, 10))) {
                return next(APIError.badRequest("Missing required fields or incorrect value for the 'vote' field."))
            }

            const deleteSQL = "DELETE FROM `ratings` WHERE comment_id = ? AND user_id = ?"
            const insertSQL = "INSERT INTO `ratings`(`comment_id`, `user_id`, `vote`) VALUES (?, ?, ?)"

            try {
                const [results] = await db.execute(deleteSQL, [commentID, userID])

                if (parseInt(vote, 10) === 0) {
                    if (results.affectedRows > 0) {
                        return res.status(200).json({status: true})
                    } else {
                        return next(APIError.notFound("Comment rating not found!"))
                    }
                } else {
                    const [result] = await db.query(insertSQL, [commentID, userID, vote])

                    if (result.affectedRows > 0 || result.insertId) {
                        return res.status(201).json({status: true})
                    } else {
                        return next(APIError.unprocessable('Failed to insert record into the database'))
                    }
                }
            } catch (err) {
                return next(APIError.internal("Internal server error: " + err))
            }

        } catch (err) {
            return next(APIError.internal("Internal server error: " + err))
        }
    }

    static async threadCheck(req, next) {
        try {
            const threadID = req.params.threadID

            let sql = "SELECT * FROM `threads` WHERE thread_token = ?"

            let [rows] = await db.query(sql, [threadID])

            if (rows.length === 0) {
                return next(APIError.notFound("This threads not found. Use '/thread/create' to create new thread."))
            }

            const thread = rows[0]

            if (thread.app_id) {
                console.log("Request appToken: " + req.headers.authorization.split(' ')[1])
            }
            return thread
        } catch (err) {
            return next(APIError.internal("Internal server error: " + err))
        }
    }

    static async recursiveDeleteComments(threadID, parentID, deletedComments, next) {
        try {
            const selectSQL = "SELECT * FROM `comments` WHERE thread_id = ? AND reply_to = ?"
            const [comments] = await db.query(selectSQL, [threadID, parentID])

            const deleteSQL = "DELETE FROM `comments` WHERE thread_id = ? AND reply_to = ?"
            await db.execute(deleteSQL, [threadID, parentID])

            for (const comment of comments) {
                deletedComments.push(comment.id)
                await ThreadController.recursiveDeleteComments(threadID, comment.id, deletedComments, next)
            }
        } catch (err) {
            return next(APIError.internal("Internal server error: " + err))
        }
    }
}

module.exports = new ThreadController()
