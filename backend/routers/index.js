const Router = require('express')
const threadRouter = require('./threadRouter')
const pagesRouter = require('./pagesRouter')


const router = new Router()

router.use('/thread', threadRouter)
router.use('/', pagesRouter)


module.exports = router
