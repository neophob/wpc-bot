const fs = require('fs');
const path = require('path');
const Emulator = require('wpc-emu');
const debug = require('debug')('bot:wpc');

module.exports = {
  getRawScreenshot
};

const CPU_STEPS = 1024;
const KEYPRESS_TICKS = 100000;

function getRawScreenshot(gameToLoad) {
  return bootEmu(gameToLoad)
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

      let dmdFrame = false;
      while (!dmdFrame) {
        dmdFrame = grabDMDFrame(wpcSystem);
      }
      const wpcState = wpcSystem.getState();
      return { dmdFrame, wpcState };
    });
}

const closedSwitchRaw = process.env.CLOSEDSW || '15,16,17';
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

function bootEmu(gameToLoad) {
  const entry = Emulator.GamelistDB.getByName(gameToLoad);
  const romU06Path = path.join(__dirname, '../rom/' + entry.rom.u06);

  return loadFile(romU06Path)
    .then((u06Rom) => {
      const romData = {
        u06: u06Rom,
      };
      return Emulator.WpcEmuApi.initVMwithRom(romData, entry);
    });
}

function grabDMDFrame(wpcSystem) {
  // the fishtales logo is visible till 20 mio ticks
  let ticks = parseInt(18000000 + Math.random() * 150000000, 10);
  debug('TICKS:', ticks);
  wpcSystem.executeCycle(ticks, CPU_STEPS);

  const switchToggles = parseInt(Math.random() * 6, 10);
  for (let i = 0; i < switchToggles; i++) {
    try {
      let input = parseInt(11 + (Math.random() * 77), 10);
      if (switchBlacklist.includes(input)) {
        input = 13;
      }
      debug('setSwitchInput:', input);
      wpcSystem.setSwitchInput(input);
      wpcSystem.executeCycle(KEYPRESS_TICKS, CPU_STEPS);
      wpcSystem.setSwitchInput(input);
    } catch (error) {}
  }

  ticks = parseInt(Math.random() * 50000000, 10);
  debug('TICKS:', ticks);
  wpcSystem.executeCycle(ticks, CPU_STEPS);

  const frame = wpcSystem.getState().asic.display.dmdShadedBuffer;

  if (imageIsEmpty(frame)) {
    return false;
  }
  if (!imageContainsAtLeast3Colors(frame)) {
    return false;
  }
  return frame;
}

function imageIsEmpty(frame) {
  const filledPixelCounter = frame.reduce((accumulator, currentValue) => {
    if (currentValue === 0) {
      return accumulator;
    }
    return accumulator + 1;
  }, 0);

  debug('filledPixelCounter', filledPixelCounter);
  return filledPixelCounter < 200;
}

function imageContainsAtLeast3Colors(frame) {
  const pixelCounter = [0, 0, 0, 0];
  frame.forEach((color) => {
    pixelCounter[color]++;
  });
  debug('pixelCounter', pixelCounter);

  let count = 0;
  if (pixelCounter[1] > 30) {
    count++;
  }
  if (pixelCounter[2] > 30) {
    count++;
  }
  if (pixelCounter[3] > 30) {
    count++;
  }

  return count >= 2;
}
