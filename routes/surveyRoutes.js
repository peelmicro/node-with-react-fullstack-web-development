const _ = require('lodash')
const pathParser = require('path-parser')
const { URL } = require('url')
const mongoose = require('mongoose')
const requireLogin = require('../middlewares/requireLogin')
const requireCredits = require('../middlewares/requireCredits')
const Mailer = require('../services/Mailer')
const surveyTemplate = require('../services/emailTemplates/surveyTemplate')

const Survey = mongoose.model('surveys')

module.exports = app => {
  app.get('/api/surveys', requireLogin, async (req, res) => {
    try {
      const surveys = await Survey.find({ _user: req.user.id })
        .select({ recipients: false })
      res.send(surveys)
    } catch (error) {
      res.status(400).send(error)
    }
  })  
  app.get('/api/surveys/:surveyId/:choice', (req, res) => {
    res.send('Thanks for voting!')
  })
  app.post('/api/surveys/webhooks', (req, res) => {
    const path = new pathParser.Path('/api/surveys/:surveyId/:choice')
    _.chain(req.body)
      .map(({ email, url }) => {
        const match = path.test(new URL(url).pathname)
        if (match) {
          return {
            email, 
            surveyId: match.surveyId,
            choice: match.choice
          }
        }
      })
      .compact()
      .uniqBy('email', 'surveyId', 'choice')
      .each(({ surveyId, email, choice }) => {
        Survey.updateOne({
          _id: surveyId,
          recipients: {
            $elemMatch: { email, responded: false}
          }
        }, {
          $inc: { [choice]: 1 },
          $set: { 'recipients.$.responded': true},
          lastResponded: Date.now()  
        }
        ).exec()
      })
      .value()
    res.send({})
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