import { readFileSync } from "fs";
import { Minigame } from "./Minigame.js";

const TILE_SIZE = 128;

export class RacingGame extends Minigame {
  raceStartTime = 0;
  track = null;
  cars = [];

  constructor() {
    super();

    const tracks = JSON.parse(readFileSync("./server/data/tracks.json"));

    this.track = tracks[1];
  }

  startGameLoop() {
    const TICK_RATE = 60;
    const MS_PER_TICK = 1000 / TICK_RATE;
    const SECONDS_PER_TICK = 1 / TICK_RATE;
    let lastTime = Date.now();
    let lastTick = lastTime;
    let accumulator = 0;

    const loop = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000.0;
      accumulator += delta;

      while (accumulator >= MS_PER_TICK) {
        this.update(SECONDS_PER_TICK);
        lastTick -= MS_PER_TICK;
      }

      this.broadcastState();

      lastTime = now;
      setImmediate(loop);
    };

    loop();
  }

  update(dt) {
    for (let car of this.cars) {
      this.checkCollisions(car);
      this.calculateDistance(car);

      const onTrack = isOnTrack(car.x, car.y, this.track.data, TILE_SIZE, ROAD_WIDTH);
      const steer = car.input.steer * car.speed;

      car.angle += steer * dt;

      if (car.input.gas) {
        car.speed = Math.min(car.speed + ACCELERATION * dt, onTrack ? MAX_SPEED : MAX_SPEED_GRASS);
      } else {
        car.speed *= onTrack ? FRICTION_COEFFICIENT : FRICTION_COEFFICIENT_GRASS;
        if (car.speed < 0.01) {
          car.speed = 0;
        }
      }

      if (car.input.brake) {
        if (car.speed > 0) car.speed *= BRAKING_COEFFICIENT;
        else car.speed = Math.max(car.speed - ACCELERATION * dt, onTrack ? -MAX_SPEED : -MAX_SPEED_GRASS);
      }

      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      let carTileX = Math.floor(car.x / TILE_SIZE);
      let carTileY = Math.floor(car.y / TILE_SIZE);

      if (carTileX != car.lastTileX || carTileY != car.lastTileY) {
        this.onEnterNewTile(car);
      }
    }

    let order = this.cars
      .map((c, i) => {
        return { index: i, distance: c.distance };
      })
      .toSorted((a, b) => b.distance - a.distance);

    for (let i = 0; i < order.length; i++) {
      this.cars[order[i].index].place = i;
      console.log("CAR: " + order[i].index + " Place:" + i);
    }
  }
  calculateDistance(car) {
    let carTileX = Math.floor(car.x / TILE_SIZE);
    let carTileY = Math.floor(car.y / TILE_SIZE);
    const subTileX = (car.x % TILE_SIZE) / TILE_SIZE;
    const subTileY = (car.y % TILE_SIZE) / TILE_SIZE;

    const tileIndex = this.track.route.findIndex((t) => t.x == carTileX && t.y == carTileY);

    let dist = car.lap * this.track.route.length + tileIndex;
    switch (this.track.route[tileIndex].direction) {
      case "north":
        dist += 1 - subTileY;
        break;
      case "south":
        dist += subTileY;
        break;
      case "west":
        dist += 1 - subTileX;
        break;
      case "east":
        dist += subTileX;
        break;
    }

    car.distance = dist;
  }
  checkCollisions(car) {
    let wallCollision = isWall(car.x, car.y, this.track.data, TILE_SIZE, 10);
    while (wallCollision.isWall) {
      car.x += Math.cos(wallCollision.wallNormal) * 0.1;
      car.y += Math.sin(wallCollision.wallNormal) * 0.1;

      wallCollision = isWall(car.x, car.y, this.track.data, TILE_SIZE, 10);
    }
  }
  onEnterNewTile(car) {
    let carTileX = Math.floor(car.x / TILE_SIZE);
    let carTileY = Math.floor(car.y / TILE_SIZE);

    const lastTileIndex = this.track.route.findIndex((t) => t.x == car.lastTileX && t.y == car.lastTileY);
    const newTileIndex = this.track.route.findIndex((t) => t.x == carTileX && t.y == carTileY);
    if (newTileIndex == lastTileIndex + 1) {
      car.tilesStack.push({ x: carTileX, y: carTileY });
    } else if (newTileIndex == lastTileIndex - 1) {
      car.tilesStack.pop();
    } else if (lastTileIndex == this.track.route.length && newTileIndex == 0) {
      onLapFinsihed(car);
    } else {
      console.log("ERROR INVALID PATH");
    }

    car.lastTileX = carTileX;
    car.lastTileY = carTileY;
  }
  onLapFinsihed(car) {
    car.lap++;
  }
  addPlayer(id) {
    this.cars.push({
      id: id,
      input: {
        steer: 0,
        gas: 0,
        brake: 0,
      },
      tilesStack: [{ x: this.track.startX, y: this.track.startY }],
      lastTileX: this.track.startX,
      lastTileY: this.track.startY,
      x: (this.track.startX + 0.5) * TILE_SIZE,
      y: (this.track.startY + 0.5) * TILE_SIZE,
      angle: 0,
      speed: 0,
      place: 0,
      lap: 0,
      distance: 0,
    });
  }
  generateTrackData(trackData, startX, startY, direction) {
    this.track.data = trackData;
    this.track.width = trackData[0].length;
    this.track.height = trackData.length;
    this.track.startX = startX;
    this.track.startY = startY;

    //let prevX = startX;
    //let prevY = startY;

    let route = [];

    let x = startX;
    let y = startY;

    let max = 50;
    do {
      if (max-- <= 0) {
        break;
      }
      let currentTile = trackData[y][x];
      route.push({ x: x, y: y, direction: direction });

      switch (currentTile) {
        case "─":
          if (direction == "east") x++;
          else x--;
          break;
        case "│":
          if (direction == "south") y++;
          else y--;
          break;
        case "┌":
          if (direction == "north") {
            x++;
            direction = "east";
          } else {
            y++;
            direction = "south";
          }
          break;
        case "┐":
          if (direction == "east") {
            y++;
            direction = "south";
          } else {
            x--;
            direction = "west";
          }
          break;
        case "┘":
          if (direction == "east") {
            y--;
            direction = "north";
          } else {
            x--;
            direction = "west";
          }
          break;
        case "└":
          if (direction == "south") {
            x++;
            direction = "east";
          } else {
            y--;
            direction = "north";
          }
          break;
        default:
          console.log("ERROR !!!!!!!!!!!!!!!!!");
          break;
      }

      route[route.length - 1].direction = direction;
    } while (x != startX || y != startY);

    this.track.route = route;
  }

  broadcastState() {
    io.to(this.lobbyCode, cars);
  }
}
