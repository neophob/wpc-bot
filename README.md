# wpc-bot
Twitter Bot - an AWS Playground

## TODO

- detect similar / identical images - aka avoid double posts
- include more stuff on the image (matrix? RAM overview)
- load state where the game is already started

## Run Locally

You need a twitter dev account, change to the `lib` directory then run

```
TWITTER_CONSUMER_KEY=.. TWITTER_CONSUMER_SECRET=.. TWITTER_ACCESS_TOKEN=.. TWITTER_ACCESS_TOKEN_SECRET=.. node index.js
```

## Run on AWS

- how to deploy properly without upload a zip file / upload to s3 -> how to autodeploy latest release from github?
- use AWS Lambda Layers (to keep deployment packages small)

### Deploy Serverless
- NOT Tested: https://serverless.com/, `npm install serverless -g`
- Use: https://claudiajs.com/, `npm install claudia -g`

### Notes
- CloudWatch triggers the Lambda function, scheduled once per hour (or use `claudia add-scheduled-event`)
- Create AWS Lambda layers: "node_modules" and "rom" are independent layers -> failed to test!
