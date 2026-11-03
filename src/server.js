require('dotenv').config()
const path = require('path')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const dbconnection = require('./config/db.config.js')
const { GlobelErrorHandaling } = require('./middleware/globelError')
const app = express()
const port = process.env.PORT || 5001
const host = process.env.HOST || "localhost"

app.use(cors());

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));
app.use(morgan('dev'))
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));


app.use('/', require('./routes/index.routes.js'))
app.use(GlobelErrorHandaling)

app.listen(port, (error) => {
    if (!error) {
        console.log(`server start at http://${host}:${port}`)
        dbconnection()
    } else {
        console.log(error)
    }
})



