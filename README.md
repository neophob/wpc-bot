# wpc-bot
Twitter Bot - an AWS Playground

## TODO
- detect similar / identical images - aka avoid double posts
- include more stuff on the image (matrix? RAM overview)
- load state where the game is already started

## Run Locally

You need a twitter account, then run

```
TWITTER_CONSUMER_KEY=.. TWITTER_CONSUMER_SECRET=.. TWITTER_ACCESS_TOKEN=.. TWITTER_ACCESS_TOKEN_SECRET=.. node index.js
```

## Run on AWS

- how to deploy properly without upload a zip file / upload to s3 -> how to autodeploy latest release from github?
- schedule lambda function
- use AWS Lambda Layers (to keep deployment packages small)
