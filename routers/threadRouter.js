const Router = require('express')
const threadController = require('../controllers/threadController')


const router = new Router()

router.get('/create', threadController.createThread)
router.get('/:threadID/comments', threadController.showThread)

router.post('/:threadID/comments/add', threadController.addComment)
router.post('/:threadID/comments/:commentID/vote', threadController.voteComment)

router.delete('/:threadID/comments/:commentID', threadController.delComment)

router.patch('/:threadID/comments/:commentID', threadController.editComment)

module.exports = router
