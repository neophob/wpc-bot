const fs = require('fs');
const path = require('path');
const Emulator = require('wpc-emu');

const GAME_TO_LOAD = 'WPC-Fliptronics: Fish Tales';
//const GAME_TO_LOAD = 'WPC-95: Attack from Mars';
const CPU_STEPS = 16;

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

  const ticks = parseInt(Math.random() * 5000000, 10);
  wpcSystem.executeCycle(ticks, CPU_STEPS);

  console.log('wpcSystem.getState().display.dmdShadedBuffer', wpcSystem.getState().display.dmdShadedBuffer);
}

bootEmu()
  .then((wpcSystem) => {
    wpcSystem.start();

    // press ESC key as the initial memory is empty and WPC shows a warning screen
    const HALF_SECOND_TICKS = 1000000;
    wpcSystem.executeCycle(HALF_SECOND_TICKS * 8, CPU_STEPS);
    wpcSystem.setCabinetInput(16);
    wpcSystem.executeCycle(HALF_SECOND_TICKS, CPU_STEPS);

    mainLoop(wpcSystem);
  })
  .catch((err) => {
    console.error('NO GOOD!', err);
    process.exit(1);
  });

