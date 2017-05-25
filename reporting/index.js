'use strict';

const AWS = require('aws-sdk');
const inspector = new AWS.Inspector({region: 'ap-northeast-1'});
const url = require('url');
const https = require('https');
const util = require('util');

function postMessage(message, callback) {
  const body = JSON.stringify(message);
  const options = url.parse(process.env.SLACK_URL);
  options.method = 'POST';
  options.headers = {'Content-Type': 'application/json'};

  const postReq = https.request(options, (res) => {
    const chunks = [];
    res.setEncoding('utf8');
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      if (callback) {
        callback({
          body: chunks.join(''),
          statusCode: res.statusCode,
          statusMessage: res.statusMessage
        });
      }
    });
    return res;
  });

  postReq.write(body);
  postReq.end();
}

exports.handler = (event, context, callback) => {
  const sns = event.Records[0].Sns
  const message = JSON.parse(sns.Message)

  console.log(util.inspect(event, {showHidden: false, depth: null}))
  if(message.event != "ASSESSMENT_RUN_COMPLETED") {
    return callback(null, null)
  }

  const templateNameP = new Promise((resolve, reject) => {
    inspector.describeAssessmentTemplates({assessmentTemplateArns: [message.template]}, (error, data) => {
      if (error) {
        return reject(error)
      }
      return resolve(data)
    })
  })

  const listFindingsP = new Promise((resolve, reject) => {
    const params = {
      assessmentRunArns: [message.run],
      filter: {
        severities: ["High"]
      },
      maxResults: 500
    }

    inspector.listFindings(params, (error, data) => {
      if (error) {
        return reject(error)
      }
      return resolve(data)
    })
  })

  Promise.all([templateNameP, listFindingsP]).then((results) => {
    const templateName = results[0].assessmentTemplates[0].name
    const findings = results[1].findingArns

    const highCount = findings.length
    const slackMessage = {
      username: "AWS Inspector Report",
      attachments: [
        {
          pretext: "Assessment Run Completed",
          text: `${highCount} high severities found\n\nTemplate Name: ${templateName}\nRun ARN: ${message.run}`,
          color: (highCount == 0) ? 'good' : 'warning'
        }
      ]
    }

    postMessage(slackMessage, (res) => {
      callback(null, results);
    })
  }).catch((error) => {
    console.log('Caught Error: ', error)
    console.log(error.stack)
    callback(error)
  })
}

//exports.handler({
//  Records: [
//    {
//      Sns: {
//        Message: JSON.stringify({
//          event: "ASSESSMENT_RUN_COMPLETED",
//          run: "arn:aws:inspector:ap-northeast-1:822761295011:target/0-QmxHBEmn/template/0-DhipW6wY/run/0-2jWnnHKY",
//          template: "arn:aws:inspector:ap-northeast-1:822761295011:target/0-QmxHBEmn/template/0-DhipW6wY"
//        })
//      }
//    }
//  ]
//}, {}, (err, data) => {})
