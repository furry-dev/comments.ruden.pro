const Router = require('express')
const pagesController = require('../controllers/pagesController')


const router = new Router()

router.get('/', pagesController.mainPage)

module.exports = router
