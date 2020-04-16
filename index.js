const Jimp = require('jimp');
const wpc = require('./wpc');
const twitter = require('./twitter');

const DMD_WIDTH = 128;
const DMD_HEIGHT = 32;

function savePng(rawScreenshot) {
  const PALETTE_R = [0, 43, 182, 254];
  const PALETTE_G = [0, 62, 155, 255];
  const PALETTE_B = [0, 67,  93, 211];

  return new Promise((resolve, reject) => {
    new Jimp(DMD_WIDTH, DMD_HEIGHT, '#000000', (err, image) => {
      if (err) {
        console.error('CREATE IMAGE FAILED', err);
        return reject(err);
      }
      let srcOffset = 0;
      let dstOffset = 0;
      for (let y = 0; y < DMD_HEIGHT; y++) {
        for (let x = 0; x < DMD_WIDTH; x++) {

          const color = rawScreenshot[srcOffset++];
          image.bitmap.data[dstOffset++] = PALETTE_R[color];
          image.bitmap.data[dstOffset++] = PALETTE_G[color];
          image.bitmap.data[dstOffset++] = PALETTE_B[color];
          image.bitmap.data[dstOffset++] = 255;
        }
      }
      image.resize(800, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);

      //TODO use image.getBuffer(Jimp.MIME_PNG, (err, image) => {});
      image.write('./out.png', (err, image) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

  });
}

wpc.getRawScreenshot()
  .then((rawScreenshot) => {
    return savePng(rawScreenshot)
  })
  .then(() => {
    return twitter.post('f00 bar!');
  })
  .catch((err) => {
    console.error('NO GOOD!', err);
    process.exit(1);
  });
