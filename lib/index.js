const Jimp = require('jimp');
const wpc = require('./wpc');
const twitter = require('./twitter');
const debug = require('debug')('bot:index');

const DMD_WIDTH = 128;
const DMD_HEIGHT = 32;
const GAME_TO_LOAD = 'WPC-Fliptronics: Fish Tales';
//const GAME_TO_LOAD = 'WPC-95: Attack from Mars';

module.exports = {
  main,
};

function addColorLines(image) {
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
}

function copyDMDContent(image, rawScreenshot) {
  const DMD_PALETTE_R = [0, 43, 182, 254];
  const DMD_PALETTE_G = [0, 62, 155, 255];
  const DMD_PALETTE_B = [0, 67,  93, 211];

  let srcOffset = 0;
  let dstOffset = 16 * DMD_WIDTH * 4;
  for (let y = 0; y < DMD_HEIGHT; y++) {
    for (let x = 0; x < DMD_WIDTH; x++) {
      const color = rawScreenshot[srcOffset++];
      image.bitmap.data[dstOffset++] = DMD_PALETTE_R[color];
      image.bitmap.data[dstOffset++] = DMD_PALETTE_G[color];
      image.bitmap.data[dstOffset++] = DMD_PALETTE_B[color];
      image.bitmap.data[dstOffset++] = 255;
    }
  }
}

function savePng(rawScreenshot) {
  return new Promise((resolve, reject) => {
    new Jimp(DMD_WIDTH, DMD_HEIGHT * 2, '#000000', (err, image) => {
      if (err) {
        console.error('CREATE IMAGE FAILED', err);
        return reject(err);
      }

      addColorLines(image);
      copyDMDContent(image, rawScreenshot)

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

function buildDescription(wpcState) {
  const randomFacts = [
    'running since ' + parseInt(wpcState.cpuState.tickCount / 2000000, 10) + ' seconds',
    'CC register value is 0x' + wpcState.cpuState.regCC.toString(16),
    'PC register value is 0x' + wpcState.cpuState.regPC.toString(16),

    'the active ROM bank is ' + wpcState.asic.wpc.activeRomBank,
    'diagnostic LED toggled ' + wpcState.asic.wpc.diagnosticLedToggleCount + ' times',
    wpcState.asic.wpc.diagnosticLed ? 'diagnostic LED is on' : 'diagnostic LED is off',

    'lamp row is ' + wpcState.asic.wpc.lampRow,
    'lamp column is ' + wpcState.asic.wpc.lampColumn,
    'zero cross counter: ' + wpcState.asic.wpc.ticksZeroCross,

    'the active display scanline is ' + wpcState.asic.display.scanline,
    'the active display page is ' + wpcState.asic.display.activepage,
  ];

  debug('randomFacts', randomFacts);
  const facts = 3 + parseInt(Math.random() * 4, 10);
  let description = GAME_TO_LOAD;
  for (let i = 0; i < facts; i++) {
    const n = parseInt(Math.random() * randomFacts.length, 10);
    description += ', ' + randomFacts[n];
  }
  description += '.';
  return description;
}

function main() {
  let _wpcState;
  return wpc.getRawScreenshot(GAME_TO_LOAD)
    .then(({dmdFrame, wpcState}) => {
      _wpcState = wpcState;
      return savePng(dmdFrame);
    })
    .then((pngImage) => {
      const description = buildDescription(_wpcState);
      return twitter.post(pngImage, description);
    })
    .catch((err) => {
      console.error('NO GOOD!', err);
      process.exit(1);
    });
}
