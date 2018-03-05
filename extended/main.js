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
    if (this.position.row !== this.currentRide.start.row) {
      if (this.position.row < this.currentRide.start.row) {
        this.position.row++;
      } else {
        this.position.row--;
      }
    } else if (this.position.column !== this.currentRide.start.column) {
      if (this.position.column < this.currentRide.start.column) {
        this.position.column++;
      } else {
        this.position.column--;
      }
    }
    if (this.position.row === this.currentRide.start.row && this.position.column === this.currentRide.start.column) {
      this.status = TO_END;
    }
  }

  goToEnd(step) {
    if (step >= this.currentRide.earliestStart) {
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

    if (this.status === TO_START) {
      this.goToStart();
    } else if (this.status === TO_END) {
      this.goToEnd(step);
    }

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
    let freeVehicles = this.vehicles.filter(vehicle => vehicle.status = FREE);
    freeVehicles.forEach(vehicle => {
      if (this.rides.length) {
        const ride = this.rides.sort((ride1, ride2) => {
          return this.rideScore(ride2, vehicle, step) - this.rideScore(ride1, vehicle, step);
        }).shift();

        vehicle.addRide(ride);
      }
    });
  }

  rideScore(ride, vehicle, step) {
    let score = 0;

    const vehicleDistance = this.distance(vehicle.position, ride.start);
    const vehicleWaiting = ride.earliestStart - step - vehicleDistance;
    const rideDistance = this.distance(ride.start, ride.end);
    const rideEndStep = step + vehicleDistance + rideDistance;
    const rideStepsBeforeLatestFinish = ride.latestFinish - rideEndStep;

    score -= vehicleDistance;

    if (vehicleWaiting === 0) {
      score += this.bonus * rideDistance;
    } else if (vehicleWaiting > 0) {
      score -= vehicleWaiting;
    } else if (vehicleWaiting < 0) {
      score -= 2 * Math.abs(vehicleWaiting);
    }

    score += rideDistance;

    if (rideStepsBeforeLatestFinish <= 0) {
      score += 2 * rideStepsBeforeLatestFinish;
    } else {
      score -= Number.MAX_SAFE_INTEGER;
    }

    return score;
  }

  simulate() {
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

//const files = ['A'];
const files = ['A', 'B', 'C', 'D', 'E'];

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