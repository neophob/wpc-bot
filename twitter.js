const Twit = require('twit');
const fs = require('fs');
const debug = require('debug')('bot:twitter');

const twit = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms:           60 * 1000,
  strictSSL:            true,
});

module.exports = {
  post,
};

function post(text) {
  return new Promise((resolve, reject) => {
    const b64content = fs.readFileSync('./out.png', { encoding: 'base64' });

    // first we must post the media to Twitter
    twit.post('media/upload', { media_data: b64content }, (err, data, response) => {
      if (err) {
        return reject(err);
      }
      debug('uploaded', response);

      const mediaIdStr = data.media_id_string;
      const params = { status: text, media_ids: [mediaIdStr] }
      twit.post('statuses/update', params, function (err, data, response) {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });

  });
}
