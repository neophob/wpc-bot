const Twit = require('twit');
const fs = require('fs');

const T = new Twit({
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
  const b64content = fs.readFileSync('./out.png', { encoding: 'base64' });

  // first we must post the media to Twitter
  T.post('media/upload', { media_data: b64content }, (err, data, response) => {
    if (err) {
      console.error('ERR media/upload', err);
      process.exit(1);
    }

    // now we can assign alt text to the media, for use by screen readers and
    // other text-based presentations and interpreters
    const mediaIdStr = data.media_id_string;
    //const altText = "a DMD screenshot"
    const meta_params = { media_id: mediaIdStr/*, alt_text: { text: altText } */}

    T.post('media/metadata/create', meta_params, (err, data, response) => {
      if (err) {
        console.error('ERR media/metadata/create', err);
        process.exit(1);
      }

      // now we can reference the media and post a tweet (media will attach to the tweet)
      const params = { status: text, media_ids: [mediaIdStr] }

      T.post('statuses/update', params, function (err, data, response) {
        if (err) {
          console.error('ERR media/metadata/create', err);
          process.exit(1);
        }
        console.log(data);
      });
    });
  });
}
