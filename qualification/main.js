'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class Config {
  constructor(line) {
    let words = line.split(' ');

  }
}


const files = ['example', 'small', 'medium', 'big'];

files.forEach(file => processFile(file));

function processFile(filename) {
  console.log(filename, 'start');
  const inputFilename = path.join(__dirname, 'input', `${filename}.in`);
  const outputFilename = path.join(__dirname, 'output', `${filename}.out`);
  if (fs.existsSync(outputFilename)) {
    fs.unlinkSync(outputFilename);
  }
  const input = fs.createReadStream(inputFilename);
  const output = fs.createWriteStream(outputFilename);

  const rl = readline.createInterface({
    input: input
  });

  let config = null;

  rl.on('line', line => {
    if (!config) {
      config = new Config(line);
    } else {

    }
  });

  rl.on('close', () => {

    console.log(filename, 'end');
  });
}