<template>
  <div>
    <div class="container">
      <div class="info">
        <div class="debug">
          <p style="position: absolute; top: 0; left: 0">debug</p>
          <p>FPS: {{ Math.round(fps) }}</p>
          <button @click="joinAsHost">Join as Host</button>
          <button @click="loop">Restart rendering</button>
          <button @click="startTime = Date.now()">Start timer</button>
        </div>
      </div>
      <div class="canvas-container">
        <RacingCanvas
          v-for="car in cars"
          :track="track"
          :car="car"
          :other-cars="cars"
          :place="0"
          :player-count="10"
          :time="startTime + 60000 - Date.now()"
          ref="gameCanvases"
        />
      </div>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
import RacingCanvas from "../../components/RacingCanvas.vue";

const MAX_SPEED = 1;
const MAX_SPEED_GRASS = 0.2;
const FRICTION_COEFFICIENT = 0.99;
const FRICTION_COEFFICIENT_GRASS = 0.9;
const BRAKING_COEFFICIENT = 0.5;
const ACCELERATION = 10;

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
          { x: 4, y: 6 },
          { x: 5, y: 6 },
          { x: 6, y: 6 },
        ],
      },

      cars: [
        {
          id: "hej",
          input: {
            steer: 0,
            gas: 0,
            brake: 0,
          },
          lastTileX: 0,
          lastTileY: 0,
          tilesStack: [],
          x: 100,
          y: 300,
          angle: 0,
          speed: 1,
        },
      ],
    };
  },
  components: { RacingCanvas },
  async created() {
    this.socket = io();
    this.socket.on("marioInput", this.onInput);
    this.socket.on("marioClient", (id) => {
      console.log("New client");
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
        x: (this.track.startX + 0.5) * 128,
        y: (this.track.startY + 0.5) * 128,
        angle: 0,
        speed: 0,
      });
    });
    this.socket.on("marioClientDisconnect", (id) => {
      console.log("Remove client: " + id);
      this.cars = this.cars.filter((x) => x.id != id);
    });
    this.joinAsHost();

    this.generateTrackData(this.track.data, this.track.startX, this.track.startY, "east");

    // Start game loop
    this.lastFrame = Date.now();
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
    joinAsHost() {
      this.socket.emit("joinMarioHost");
      console.log("JOINING AS HOST: " + this.socket);
    },
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
        const isOnTrack = this.isOnTrack(car.x, car.y);
        const steer = car.input.steer * car.speed;

        car.angle += steer * dt;

        if (car.input.gas) {
          car.speed = Math.min(car.speed + ACCELERATION * dt, isOnTrack ? MAX_SPEED : MAX_SPEED_GRASS);
        } else {
          car.speed *= isOnTrack ? FRICTION_COEFFICIENT : FRICTION_COEFFICIENT_GRASS;
          if (car.speed < 0.01) {
            car.speed = 0;
          }
        }

        if (car.input.brake) {
          if (car.speed > 0) car.speed *= BRAKING_COEFFICIENT;
          else car.speed = Math.max(car.speed - ACCELERATION * dt, isOnTrack ? -MAX_SPEED : -MAX_SPEED_GRASS);
        }

        car.x += Math.cos(car.angle) * car.speed;
        car.y += Math.sin(car.angle) * car.speed;

        let carTileX = Math.floor(car.x / 128);
        let carTileY = Math.floor(car.y / 128);

        if (carTileX != car.lastTileX || carTileY != car.lastTileY) {
          car.tilesStack.push({ x: carTileX, y: carTileY });
          car.lastTileX = carTileX;
          car.lastTileY = carTileY;
        }
      }
    },

    isOnTrack(x, y) {
      return true;

      //if (this._mask32 == null) return 5;
      //const tx = (((x | 0) % this._maskW) + this._maskW) % this._maskW;
      //const ty = (((y | 0) % this._maskH) + this._maskH) % this._maskH;
      //
      //const v = this._mask32[ty * this._maskW + tx];
      //
      //return v > 128; // white = road
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
        route.push({ x: x, y: y });

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
