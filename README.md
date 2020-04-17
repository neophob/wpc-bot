# wpc-bot
Twitter Bot - an AWS Playground

## TODO
- detect similar / identical images - aka avoid double posts
- include more stuff on the image (RAM overview)
- load state where the game is already started

## Run Locally
- You need a twitter dev account
- You need to create a `rom` directory and add the WPC roms yourself
- change to the `lib` directory then run

```
TWITTER_CONSUMER_KEY=.. TWITTER_CONSUMER_SECRET=.. TWITTER_ACCESS_TOKEN=.. TWITTER_ACCESS_TOKEN_SECRET=.. node run.js
```

## Run on AWS
- CloudWatch triggers the Lambda function, scheduled once per hour (or use `claudia add-scheduled-event`)
- TODO: Create AWS Lambda layers: "node_modules" and "rom" are independent layers -> failed to test!

### Deploy Serverless
- Use: https://claudiajs.com/, `npm install claudia -g`
- NOT Tested: https://serverless.com/, `npm install serverless -g`
