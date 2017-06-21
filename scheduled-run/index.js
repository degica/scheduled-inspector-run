const AWS = require('aws-sdk')
const inspector = new AWS.Inspector()
const templateArns = process.env.assessmentTemplateArns.split(',')

exports.handler = (event, context, callback) => {
  const runs = templateArns.map((t) => {
    new Promise((resolve, reject) => {
      const params = {
        assessmentTemplateArn: t
      }

      inspector.startAssessmentRun(params, (error, data) => {
        if (error) {
          console.log(error, error.stack);
          reject(error)
        }

        console.log(data);
        resolve(data);
      });
    })
  })

  Promise.all(runs).then((results) => {
    callback(null, results)
  }).catch((error) => {
    console.log('Caught Error: ', error)
    callback(error)
  })
}
