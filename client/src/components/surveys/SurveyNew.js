// SurveyNew shows SurveyForm and SurveyFormReview
import React, { Component } from 'react'
import { reduxForm } from 'redux-form'
import SurveyForm from './SurveyForm'
import SurveyFormReview from './SurveyFormReview'

class SurveyNew extends Component {
  // constructor(props) {
  //   super(props)

  //   this.state = { showFormReview: false }
  // }
  state = { showFormReview: false }

  renderContent() {
    if (this.state.showFormReview) {
      return (
        <SurveyFormReview
          onCancel={() => this.setState({ showFormReview: false })}
        />
      )
    }
    return (
      <SurveyForm
        onSurveySubmit={() => this.setState({ showFormReview: true })}
      />
    )
  }
  render() {
    return <div>{this.renderContent()}</div>
  }
}

export default reduxForm({
  form: 'surveyForm',
  destroyOnUnmount: true // this value is the default value so it's not necessary to put it
})(SurveyNew)
