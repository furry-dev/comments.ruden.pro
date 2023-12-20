const uuid = require('uuid')
const db = require('./db')

const generateUniqueToken = async () => {
    let isTokenUnique = false
    let token

    while (!isTokenUnique) {
        token = uuid.v4()

        const sql = 'SELECT * FROM threads WHERE thread_token = ?'

        let rows

        try {
            [ rows ] = await db.query(sql, [token])
        } catch (e) {
            return e
        }
        console.log('Query result: ', rows)
        isTokenUnique = rows.length === 0
    }

    return token
}

module.exports = {
    generateUniqueToken,
}
