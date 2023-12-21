const APIError = require('../errors/APIError')

module.exports = function (err, req, res, next) {
    if (err instanceof APIError) {
        return res.status(err.status).json({message: err.message})
    }
    return res.status(500).json({message: "Непредвиденная ошибка!"})
}
