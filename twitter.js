const Twit = require('twit');
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

function post(pngImage, text) {
  return new Promise((resolve, reject) => {
    const pngImageBase64Encoded = pngImage.toString('base64');

    twit.post('media/upload', { media_data: pngImageBase64Encoded }, (err, data, response) => {
      if (err) {
        return reject(err);
      }
      debug('uploaded');

      const mediaIdStr = data.media_id_string;
      const params = { status: text, media_ids: [mediaIdStr] };
      twit.post('statuses/update', params, function (err, data, response) {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });

  });
}
