'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const WAITING = 0;
const TO_START = 1;
const TO_END = 2;
const FREE = 3;

class Vehicle {
  constructor(id) {
    this.id = id;
    this.rides = [];
    this.currentRide = null;
    this.position = {
      row: 0,
      column: 0,
    };
    this.status = FREE;
  }

  get assignedRides() {
    let assignedRides = '';
    this.rides.forEach(ride => {
      if (assignedRides) {
        assignedRides += ` ${ride.id}`;
      } else {
        assignedRides = `${ride.id}`;
      }
    });
    return assignedRides;
  }

  addRide(ride) {
    this.rides.push(ride);
    this.currentRide = ride;
    this.status = TO_START;
  }

  goToStart() {
    let hasMoved = false;
    if (this.position.row !== this.currentRide.start.row) {
      hasMoved = true;
      if (this.position.row < this.currentRide.start.row) {
        this.position.row++;
      } else {
        this.position.row--;
      }
    } else if (this.position.column !== this.currentRide.start.column) {
      hasMoved = true;
      if (this.position.column < this.currentRide.start.column) {
        this.position.column++;
      } else {
        this.position.column--;
      }
    }
    if (this.position.row === this.currentRide.start.row && this.position.column === this.currentRide.start.column) {
      this.status = WAITING;
    }
    return hasMoved;
  }

  goToEnd(step) {
    if (step >= this.currentRide.earliestStart) {
      this.status = TO_END;
      if (this.position.row !== this.currentRide.end.row) {
        if (this.position.row < this.currentRide.end.row) {
          this.position.row++;
        } else {
          this.position.row--;
        }
      } else if (this.position.column !== this.currentRide.end.column) {
        if (this.position.column < this.currentRide.end.column) {
          this.position.column++;
        } else {
          this.position.column--;
        }
      }

      if (this.position.row === this.currentRide.end.row && this.position.column === this.currentRide.end.column) {
        this.currentRide = null;
        this.status = FREE;
      }
    }
  }

  move(step) {

    if (this.driving) {
      const hasMoved = this.goToStart();

      if (!hasMoved && (this.status === WAITING || this.status === TO_END)) {
        this.goToEnd(step);
      }
    }
  }

  get driving() {
    return this.currentRide !== null;
  }
}

class Ride {
  constructor(id, line) {
    this.id = id;
    let words = line.split(' ');
    this.start = {
      row: parseInt(words[0]),
      column: parseInt(words[1]),
    };
    this.end = {
      row: parseInt(words[2]),
      column: parseInt(words[3]),
    };
    this.earliestStart = parseInt(words[4]);
    this.latestFinish = parseInt(words[5]);
  }

  get distance() {
    return Math.abs(this.start.row - this.end.row) + Math.abs(this.start.column - this.end.column);
  }
}

class SelfDrivingRides {
  constructor(line) {
    let words = line.split(' ');
    this.rows = parseInt(words[0]);
    this.columns = parseInt(words[1]);
    this.totalVehicles = parseInt(words[2]);
    this.totalRides = parseInt(words[3]);
    this.bonus = parseInt(words[4]);
    this.steps = parseInt(words[5]);

    this.rides = [];
    this.vehicles = [];

    for (let i = 0; i < this.totalVehicles; i++) {
      this.vehicles.push(new Vehicle(i));
    }
  }

  addRide(line) {
    this.rides.push(new Ride(this.rides.length, line));
  }

  assignRides(step) {
    let freeVehicles = this.vehicles.filter(vehicle => !vehicle.driving);
    const ridesToAssign = this.rides.splice(0, freeVehicles.length);

    ridesToAssign.forEach(ride => {


      freeVehicles.sort((vehicle1, vehicle2) => {
        const stepsWaiting1 = step + this.distance(vehicle1.position, ride.start) - ride.earliestStart;
        const stepsWaiting2 = step + this.distance(vehicle2.position, ride.start) - ride.earliestStart;

        if (stepsWaiting1 === 0) {
          return -1;
        } else if (stepsWaiting2 === 0) {
          return 1;
        } else if (stepsWaiting1 < 0 && stepsWaiting2 > 0) {
          return stepsWaiting1;
        } else if (stepsWaiting1 > 0 && stepsWaiting2 < 0) {
          return stepsWaiting2;
        } else if (stepsWaiting1 > 0 && stepsWaiting2 > 0) {
          return stepsWaiting1 - stepsWaiting2;
        } else if (stepsWaiting1 < 0 && stepsWaiting2 < 0) {
          return stepsWaiting2 - stepsWaiting1;
        }
      });

      const vehicle = freeVehicles.shift();

      const startTime = step + this.distance(vehicle.position, ride.start);
      if (startTime + this.distance(ride.start, ride.end) <= ride.latestFinish) {
        vehicle.addRide(ride);
      }
    });
  }

  simulate() {
    this.rides.sort((ride1, ride2) => {
      return ride1.earliestStart - ride2.earliestStart
    });
    for (let step = 0; step < this.steps; step++) {
      this.assignRides(step);

      this.vehicles.forEach(vehicle => {
        vehicle.move(step);
      });

      this.assignRides(step + 1);
    }
  }

  distance(position1, position2) {
    return Math.abs(position1.row - position2.row) + Math.abs(position1.column - position2.column);
  }
}

const files = ['A'];
//const files = ['A', 'B', 'C', 'D', 'E'];

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

  let selfDrivingRides = null;

  rl.on('line', line => {
    if (!selfDrivingRides) {
      selfDrivingRides = new SelfDrivingRides(line);
    } else {
      selfDrivingRides.addRide(line);
    }
  });

  rl.on('close', () => {
    selfDrivingRides.simulate();

    selfDrivingRides.vehicles.forEach(vehicle => {
      output.write(vehicle.rides.length + ' ' + vehicle.assignedRides + '\n');
    });

    console.log(filename, 'end');
  });
}