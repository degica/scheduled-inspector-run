# AWS Inspector scheduled run and reporting

Run AWS Inspector periodically and report run results to Slack.
Currently only Tokyo (`ap-northeast-1`) region is supported.

## Deploy

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
