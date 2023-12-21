class APIError extends Error {
    constructor(status, message) {
        super()
        this.status = status
        this.message = message
    }

    static badRequest(message) {
        return new APIError(400, message)
    }

    static forbidden(message) {
        return new APIError(403, message)
    }

    static notFound(message) {
        return new APIError(403, message)
    }

    static unprocessable(message) {
        return new APIError(422, message)
    }

    static internal(message) {
        return new APIError(500, message)
    }
}

module.exports = APIError
