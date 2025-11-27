<template>
  <div>
    <div class="container">
      <div class="info">
        <div class="debug">
          <p style="position: absolute; top: 0; left: 0">debug</p>
          <p>FPS: {{ Math.round(fps) }}</p>
          <!--<button @click="joinAsHost">Join as Host</button>-->
          <button @click="loop">Restart rendering</button>
          <button @click="startTime = Date.now()">Start timer</button>
          <button @click="cars = []">Remove all players</button>
          <button @click="spawnPlayer('ghost')">Add ghost player</button>
        </div>
      </div>
      <div class="canvas-container">
        <RacingCanvas
          v-for="car in cars"
          :track="track"
          :car="car"
          :other-cars="cars"
          :place="0"
          :player-count="cars.length"
          :time="Date.now() - startTime"
          ref="gameCanvases"
        />
      </div>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
import RacingCanvas from "../../../components/RacingCanvas.vue";
import { isOnTrack, isWall } from "./RacingGameHelper";

const MAX_SPEED = 1;
const MAX_SPEED_GRASS = 0.2;
const FRICTION_COEFFICIENT = 0.99;
const FRICTION_COEFFICIENT_GRASS = 0.9;
const BRAKING_COEFFICIENT = 0.5;
const ACCELERATION = 10;

export const TILE_SIZE = 128;
export const ROAD_WIDTH = 64;

export default {
  name: "RacingView",

  data() {
    return {
      // phone tilt
      socket: null,
      // canvas
      canvasWidth: 700,
      canvasHeight: 700,
      ctx: null,

      // images
      trackImg: null,
      carImg: null,

      // camera
      cameraAngle: 0,

      //temps,
      fps: 0,
      startTime: 0,

      //world & cars

      track: {
        width: 8,
        height: 8,
        data: ["########", "#┌───┐##", "#│#┌─┘##", "#└┐│┌─┐#", "#┌┘└┘┌┘#", "#│###└┐#", "#└────┘#", "########"],
        startX: 4,
        startY: 6,
        route: [
          { x: 4, y: 6, direction: "east" },
          { x: 5, y: 6, direction: "east" },
          { x: 6, y: 6, direction: "east" },
        ],
      },

      cars: [],
    };
  },
  components: { RacingCanvas },
  async created() {
    this.socket = io();
    //this.socket.on("marioInput", this.onInput);
    //this.socket.on("marioClient", this.spawnPlayer);
    //this.socket.on("marioClientDisconnect", (id) => {
    //  console.log("Remove client: " + id);
    //  this.cars = this.cars.filter((x) => x.id != id);
    //});
    //this.joinAsHost();

    this.generateTrackData(this.track.data, this.track.startX, this.track.startY, "east");

    // Start game loop
    this.lastFrame = Date.now();
    this.startTime = Date.now();
    requestAnimationFrame(this.loop);
  },

  methods: {
    loop() {
      const now = Date.now();
      const delta = (now - this.lastFrame) / 1000;
      this.fps = 1 / delta;
      this.update(delta);

      if (this.$refs.gameCanvases) {
        for (let gameCanvas of this.$refs.gameCanvases) gameCanvas.render();
      }

      requestAnimationFrame(this.loop);
      this.lastFrame = now;
    },
    //joinAsHost() {
    //  this.socket.emit("joinMarioHost");
    //  console.log("JOINING AS HOST: " + this.socket);
    //},
    onInput(input, id) {
      //const id = "hej";
      const car = this.cars.filter((x) => x.id == id);
      if (car.length != 0) {
        car[0].input.steer = input.steer;
        car[0].input.gas = input.gas;
        car[0].input.brake = input.brake;
      }
    },
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
    },
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
    },
    checkCollisions(car) {
      let wallCollision = isWall(car.x, car.y, this.track.data, TILE_SIZE, 10);
      while (wallCollision.isWall) {
        car.x += Math.cos(wallCollision.wallNormal) * 0.1;
        car.y += Math.sin(wallCollision.wallNormal) * 0.1;

        wallCollision = isWall(car.x, car.y, this.track.data, TILE_SIZE, 10);
      }
    },
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
    },
    onLapFinsihed(car) {
      car.lap++;
    },
    spawnPlayer(id) {
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
    },

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
    },
  },
};
</script>

<style scoped>
h1 {
  color: #cfc6c6;
  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
  font-size: 3rem;
}
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info {
}
.debug {
  position: relative;
  background: red;
  color: white;
  float: right;
}
.debug p {
  margin: 0;
}

.canvas-container {
  display: flex;
  flex-grow: 1;
  gap: 1rem;
  justify-content: center;
}
</style>
