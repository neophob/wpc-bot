const fs = require('fs');
const path = require('path');
const Emulator = require('wpc-emu');
const Jimp = require('jimp');
const debug = require('debug')('bot');
const twitter = require('./twitter');

const GAME_TO_LOAD = 'WPC-Fliptronics: Fish Tales';
//const GAME_TO_LOAD = 'WPC-95: Attack from Mars';
const CPU_STEPS = 16;
const DMD_WIDTH = 128;
const DMD_HEIGHT = 32;
const KEYPRESS_TICKS = 100000;

const closedSwitchRaw = process.env.CLOSEDSW || '15,16,17,21';
const switchBlacklist = closedSwitchRaw.split(',').map((n) => parseInt(n, 10));
switchBlacklist.push(21);

function loadFile(fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (error, data) => {
      if (error) {
        return reject(error);
      }
      resolve(new Uint8Array(data));
    });
  });
}

function bootEmu() {
  const entry = Emulator.GamelistDB.getByName(GAME_TO_LOAD);
  const romU06Path = path.join(__dirname, '/rom/' + entry.rom.u06);

  return loadFile(romU06Path)
    .then((u06Rom) => {
      const romData = {
        u06: u06Rom,
      };
      return Emulator.WpcEmuApi.initVMwithRom(romData, entry);
    });
}

function grabDMDFrame(wpcSystem) {
  let ticks = parseInt(5000000 + Math.random() * 150000000, 10);
  debug('TICKS:', ticks)
  wpcSystem.executeCycle(ticks, CPU_STEPS);

  for (let i = 0; i < 3; i++) {
    try {
      let input = parseInt(11 + (Math.random() * 77), 10);
      if (switchBlacklist.includes(input)) {
        input = 13;
      }
      debug('setSwitchInput:', input)
      wpcSystem.setSwitchInput(input);
      wpcSystem.executeCycle(KEYPRESS_TICKS, CPU_STEPS);
      wpcSystem.setSwitchInput(input);
    } catch (error) {}
  }

  ticks = parseInt(Math.random() * 50000000, 10);
  debug('TICKS:', ticks)
  wpcSystem.executeCycle(ticks, CPU_STEPS);

  const frame = wpcSystem.getState().asic.display.dmdShadedBuffer;
  const filledPixelCounter = frame.reduce((accumulator, currentValue) => {
    if (currentValue === 0) {
      return accumulator;
    }
    return accumulator + 1;
  }, 0);

  if (filledPixelCounter < 200) {
    debug('BORING', filledPixelCounter);
    return false;
  }
  debug('filledPixelCounter', filledPixelCounter)
  //TODO bail out if image is boring

  return frame;
}

function savePng(data) {
  const PALETTE_R = [0, 43, 182, 254];
  const PALETTE_G = [0, 62, 155, 255];
  const PALETTE_B = [0, 67,  93, 211];
  new Jimp(DMD_WIDTH, DMD_HEIGHT, '#000000', (err, image) => {
    if (err) {
      console.error('CREATE IMAGE FAILED', err);
      throw err;
    }
    let srcOffset = 0;
    let dstOffset = 0;
    for (let y = 0; y < DMD_HEIGHT; y++) {
      for (let x = 0; x < DMD_WIDTH; x++) {

        const color = data[srcOffset++];
        image.bitmap.data[dstOffset++] = PALETTE_R[color];
        image.bitmap.data[dstOffset++] = PALETTE_G[color];
        image.bitmap.data[dstOffset++] = PALETTE_B[color];
        image.bitmap.data[dstOffset++] = 255;
      }
    }
    image.write('./out.png', (err, image) => {
      if (err) {
        console.error('WRITE IMAGE FAILED', err);
        throw err;
      }
      twitter.post();
    });
  });
}

bootEmu()
  .then((wpcSystem) => {
    wpcSystem.start();

    // press ESC key as the initial memory is empty and WPC shows a warning screen
    const HALF_SECOND_TICKS = 1000000;
    wpcSystem.executeCycle(HALF_SECOND_TICKS * 8, CPU_STEPS);
    wpcSystem.setCabinetInput(16);
    wpcSystem.executeCycle(HALF_SECOND_TICKS, CPU_STEPS);

    // enter money
    wpcSystem.setCabinetInput(2);
    wpcSystem.executeCycle(KEYPRESS_TICKS, CPU_STEPS);

    // start game
    wpcSystem.setSwitchInput(13);
    wpcSystem.executeCycle(KEYPRESS_TICKS, CPU_STEPS);
    wpcSystem.setSwitchInput(13);

    grabDMDFrame(wpcSystem);

    let dmdFrame = false;
    while (!dmdFrame) {
      dmdFrame = grabDMDFrame(wpcSystem);
    }
    savePng(dmdFrame);

  })
  .catch((err) => {
    console.error('NO GOOD!', err);
    process.exit(1);
  });

