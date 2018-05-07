const mongoose = require('mongoose')
const requireLogin = require('../middlewares/requireLogin')
const requireCredits = require('../middlewares/requireCredits')
const Mailer = require('../services/Mailer')
const surveyTemplate = require('../services/emailTemplates/surveyTemplate')

const Survey = mongoose.model('surveys')

module.exports = app => {
  app.get('/api/surveys/thanks', requireLogin, requireCredits, async (req, res) => {
    res.send('Thanks for voting!')
  })
  app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
    const { title, subject, body, recipients } = req.body
    const survey = new Survey({
      title,
      subject,
      body,
      recipients: recipients.split(',').map(email => ({ email: email.trim() })),
      _user: req.user.id,
      dateSent: Date.now() // It's not completely correct but close
    })
    const mailer = new Mailer(survey, surveyTemplate(survey))
    try {
      await mailer.send() // To send the email using SendGrid
      await survey.save() // To create the new survey on the mongodb database
      req.user.credits -= 1 // To reduce the number of credits
      const user = await req.user.save() // To update the credits to the user 
      res.send(user) // To update the balance on the header
    } catch (error) {
      res.status(422).send(error)
    }
  })  
}