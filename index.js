const express = require('express')
const mongoose = require('mongoose')
const cookieSession = require('cookie-session')
const passport = require('passport')
const keys = require('./config/keys')

require('./models/User') // Just to execute it
require('./services/passport') // Just to execute it

mongoose.connect(keys.mongoUri)

const app = express()

// express middlewares
app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey]
  })
)
app.use(passport.initialize())
app.use(passport.session())

require('./routes/authRoutes')(app)

const PORT = process.env.PORT || 5000
app.listen(PORT)

//http://localhost:5000/
