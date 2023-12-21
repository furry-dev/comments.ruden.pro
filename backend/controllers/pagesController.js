const APIError = require("../errors/APIError")

class ThreadController {
    mainPage(req, res, next) {
        res.render('../../frontend/pages/main')
    }
}


module.exports = new ThreadController()
