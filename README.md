# AWS Inspector scheduled run and reporting

Run AWS Inspector periodically and report run results to Slack.
Currently only Tokyo (`ap-northeast-1`) region is supported.

## Deploy
### Create a new AWS Inspector template

Create a new Inspector template with your preffered rule packages on the AWS web console.

### Deploy Resources

```bash
# Create a SAM package
$ aws cloudformation package \
  --template-file ./template.yaml \
  --s3-bucket=<S3 bucket name> \
  --output-template-file packaged-template.yml

# Deploy the package
$ aws cloudformation deploy \
  --region=ap-northeast-1 \
  --template-file ./packaged-template.yml \
  --stack-name scheduled-inspector-run \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    TemplateArns=<comma-separated AWS Inspector template ARNs> \
    Schedule="cron(45 5 ? * * *)" \
    SlackUrl=<Slack URL>
```

Use your Inspector template ARN as `TemplateArns`. You can also change `Schedule`.

### Setup SNS notification on the Inspector template

In the previous step, you created all required AWS resources to run scheduled Inspector run.
Now you need to set Reporting SNS topic that is created in the previous step to your Inspector template with "Run finished" event enabled.
