// config
const port = 3000


// import
const express = require('express')
const multer = require('multer')
const errorHandler = require('./middleware/ErrorHandlingMiddlware')
const router = require('./routers/index')


// initialise app
const app = express()
app.use(express.json())
const upload = multer()
app.use(upload.none())

// requests
app.use('/', router)

// error processing, last middleware
app.use(errorHandler)


// start
const start = async () => {
    try {
        app.listen(port, () => {
            console.log(`Server start at http://localhost:${port}`)
        })
    } catch (e) {
        console.log(e)
    }
}

start().then(() => {
    console.log("Service start!")
})