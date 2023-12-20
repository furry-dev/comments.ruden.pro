const Router = require('express')
const threadRouter = require('./threadRouter')


const router = new Router()

router.use('/thread', threadRouter)

module.exports = router
