// config
const port = 3000


// import
const express = require('express')
const multer = require('multer')
const errorHandler = require('./middleware/ErrorHandlingMiddlware')
const router = require('./routers')


// initialise app
const app = express()
app.use(express.json())
const upload = multer()
app.use(upload.none())

app.set('view engine', 'ejs')

// requests
app.use('/', router)

app.use("/data", express.static("../frontend/assets"))
app.use(express.static("../frontend/dist"))

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