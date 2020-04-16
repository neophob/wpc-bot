const Jimp = require('jimp');
const wpc = require('./wpc');
const twitter = require('./twitter');

const DMD_WIDTH = 128;
const DMD_HEIGHT = 32;

module.exports = {
  main,
};

function savePng(rawScreenshot) {
  const PALETTE_R = [0, 43, 182, 254];
  const PALETTE_G = [0, 62, 155, 255];
  const PALETTE_B = [0, 67,  93, 211];

  return new Promise((resolve, reject) => {
    new Jimp(DMD_WIDTH, DMD_HEIGHT * 2, '#000000', (err, image) => {
      if (err) {
        console.error('CREATE IMAGE FAILED', err);
        return reject(err);
      }

      let dstOffset = 60 * DMD_WIDTH * 4;

      // draw colors on the bottom aka "branding"
      for (let x = 0; x < DMD_WIDTH * 4; x+=4) {
        image.bitmap.data[dstOffset + x    ] = 106;
        image.bitmap.data[dstOffset + x + 1] = 198;
        image.bitmap.data[dstOffset + x + 2] = 213;
        image.bitmap.data[dstOffset + x + 3] = 255;

        image.bitmap.data[DMD_WIDTH * 4 + dstOffset + x    ] = 254;
        image.bitmap.data[DMD_WIDTH * 4 + dstOffset + x + 1] = 255;
        image.bitmap.data[DMD_WIDTH * 4 + dstOffset + x + 2] = 211;
        image.bitmap.data[DMD_WIDTH * 4 + dstOffset + x + 3] = 255;

        image.bitmap.data[2 * DMD_WIDTH * 4 + dstOffset + x    ] = 255;
        image.bitmap.data[2 * DMD_WIDTH * 4 + dstOffset + x + 1] = 108;
        image.bitmap.data[2 * DMD_WIDTH * 4 + dstOffset + x + 2] = 74;
        image.bitmap.data[2 * DMD_WIDTH * 4 + dstOffset + x + 3] = 255;
      }

      // copy DMD content
      let srcOffset = 0;
      dstOffset = 16 * DMD_WIDTH * 4;
      for (let y = 0; y < DMD_HEIGHT; y++) {
        for (let x = 0; x < DMD_WIDTH; x++) {
          const color = rawScreenshot[srcOffset++];
          image.bitmap.data[dstOffset++] = PALETTE_R[color];
          image.bitmap.data[dstOffset++] = PALETTE_G[color];
          image.bitmap.data[dstOffset++] = PALETTE_B[color];
          image.bitmap.data[dstOffset++] = 255;
        }
      }

      // build png to upload as buffer
      image.resize(800, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
      image.getBuffer(Jimp.MIME_PNG, (err, image) => {
        if (err) {
          return reject(err);
        }
        resolve(image);
      });
    });

  });
}

function main() {
  let tweetText = '';
  return wpc.getRawScreenshot()
    .then(({dmdFrame, description}) => {
      tweetText = description;
      return savePng(dmdFrame);
    })
    .then((pngImage) => {
      return twitter.post(pngImage, tweetText);
    })
    .catch((err) => {
      console.error('NO GOOD!', err);
      process.exit(1);
    });
}
