<template>
  <div>
    <h1>2.5D Racer</h1>
    <p>FPS: {{ Math.round(fps) }}</p>
    <p>
      Gas: {{ gas }} Brake: {{ brake }} Speed: {{ Math.round(car.speed * 100) / 100 }} Tilt (steer): {{ Math.round(steer * 100) / 100 }} Pos = x:
      {{ Math.round(car.x) }} Z: {{ Math.round(car.y) }} On track?
      {{ isOnTrack(car.x, car.y) }}
    </p>
    <button @click="joinAsHost">Join as Host</button>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import trackURL from "@/assets/track_1.png";
import trackMaskURL from "@/assets/track_1_mask.png";
import carURL from "@/assets/car_2.png";
import carLeftURL from "@/assets/car_2_left.png";
import carRightURL from "@/assets/car_2_right.png";

import io from "socket.io-client";

const MAX_SPEED = 1;
const MAX_SPEED_GRASS = 0.2;

const FRICTION_COEFFICIENT = 0.99;
const FRICTION_COEFFICIENT_GRASS = 0.9;

const BRAKING_COEFFICIENT = 0.5;

const ACCELERATION = 10;

export default {
  name: "RacingViewOld",

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

      //inputs
      steer: 0,
      gas: 0,
      brake: 0,

      // world / car physics
      car: {
        x: 100,
        y: 300,
        angle: 0,
        speed: 0,
      },
    };
  },

  created: function () {
    console.log("JOINING SERVER");
    this.socket = io();
    console.log("DONE SERVERE");
    this.socket.on("marioInput", this.onInput);
  },

  async mounted() {
    // Load images
    this.trackImg = await this.loadImage(trackURL);
    this.trackMaskImg = await this.loadImage(trackMaskURL);
    this.carImg = await this.loadImage(carURL);
    this.carLeftImg = await this.loadImage(carLeftURL);
    this.carRightImg = await this.loadImage(carRightURL);

    console.log(this.trackImg);

    // Canvas setup
    const canvas = this.$refs.canvas;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.ctx = canvas.getContext("2d");

    // Start game loop
    this.lastFrame = Date.now();
    this.prepareMask(this.trackMaskImg);
    this.prepareTexture(this.trackImg);
    requestAnimationFrame(this.loop);
  },

  methods: {
    // Helper: load an image
    loadImage(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    },

    // Main loop
    loop() {
      const now = Date.now();
      const delta = (now - this.lastFrame) / 1000;
      this.fps = 1 / delta;
      this.update(delta);
      this.render();
      requestAnimationFrame(this.loop);
      this.lastFrame = now;
    },
    joinAsHost() {
      this.socket.emit("joinMarioHost");
      console.log("JOINING AS HOST: " + this.socket);
    },
    onInput(input) {
      this.steer = input.steer;
      this.gas = input.gas;
      this.brake = input.brake;
    },
    // Physics
    update(dt) {
      const isOnTrack = this.isOnTrack(this.car.x, this.car.y);
      const steer = this.steer * this.car.speed;

      this.car.angle += steer * dt;

      if (this.gas) {
        this.car.speed = Math.min(this.car.speed + ACCELERATION * dt, isOnTrack ? MAX_SPEED : MAX_SPEED_GRASS);
      } else {
        this.car.speed *= isOnTrack ? FRICTION_COEFFICIENT : FRICTION_COEFFICIENT_GRASS;
        if (this.car.speed < 0.01) {
          this.car.speed = 0;
        }
      }

      if (this.brake) {
        if (this.car.speed > 0) this.car.speed *= BRAKING_COEFFICIENT;
        else this.car.speed = Math.max(this.car.speed - ACCELERATION * dt, isOnTrack ? -MAX_SPEED : -MAX_SPEED_GRASS);
      }

      this.car.x += Math.cos(this.car.angle) * this.car.speed;
      this.car.y += Math.sin(this.car.angle) * this.car.speed;
    },

    isOnTrack(x, y) {
      if (this._mask32 == null) return 5;
      const tx = (((x | 0) % this._maskW) + this._maskW) % this._maskW;
      const ty = (((y | 0) % this._maskH) + this._maskH) % this._maskH;

      const v = this._mask32[ty * this._maskW + tx];

      return v > 128; // white = road
    },
    // Call once when your texture image is loaded
    prepareTexture(trackImg) {
      const imgW = trackImg.width;
      const imgH = trackImg.height;

      const texCanvas = document.createElement("canvas");
      texCanvas.width = imgW;
      texCanvas.height = imgH;
      const texCtx = texCanvas.getContext("2d", { willReadFrequently: true });
      texCtx.drawImage(trackImg, 0, 0);

      const texData8 = texCtx.getImageData(0, 0, imgW, imgH).data;
      const tex32 = new Uint32Array(imgW * imgH);

      // Pack RGBA into Uint32: 0xAABBGGRR for little-endian
      for (let i = 0, p = 0; i < tex32.length; i++, p += 4) {
        tex32[i] =
          (255 << 24) | // A
          (texData8[p + 2] << 16) | // B
          (texData8[p + 1] << 8) | // G
          texData8[p + 0]; // R
      }

      this._tex32 = tex32;
      this._texW = imgW;
      this._texH = imgH;
    },
    prepareMask(maskImg) {
      const w = maskImg.width;
      const h = maskImg.height;

      const can = document.createElement("canvas");
      can.width = w;
      can.height = h;
      const ctx = can.getContext("2d");
      ctx.drawImage(maskImg, 0, 0);

      const data = ctx.getImageData(0, 0, w, h).data;
      const arr = new Uint32Array(w * h);

      for (let i = 0, p = 0; i < arr.length; i++, p += 4) {
        const r = data[p];
        arr[i] = r; // just use red channel
      }

      this._mask32 = arr;
      this._maskW = w;
      this._maskH = h;
    },
    // Call every frame
    renderMode7Fast() {
      const ctx = this.ctx;
      const w = this.canvasWidth;
      const h = this.canvasHeight;

      const tex32 = this._tex32;
      const texW = this._texW;
      const texH = this._texH;
      if (!tex32) return; // texture not ready

      // --- Camera / params ---
      const cameraX = this.car.x - Math.cos(this.car.angle) * 25;
      const cameraY = this.car.y - Math.sin(this.car.angle) * 25;
      const cameraAngle = this.car.angle;

      const horizon = (h * 0.45) | 0;
      const scaleConst = 5000; // bigger = flatter / less zoom
      const fov = 1.2; // 1.0–1.5 typical

      // fixed-point shift (10 bits ≈ /1024)
      const FP = 10;
      const ONE = 1 << FP;

      const sinA = Math.sin(cameraAngle);
      const cosA = Math.cos(cameraAngle);

      // Create / reuse output buffer
      if (!this._frameBuffer || this._frameW !== w || this._frameH !== h) {
        this._frameW = w;
        this._frameH = h;
        this._frameAB = new ArrayBuffer(w * h * 4);
        this._frame32 = new Uint32Array(this._frameAB);
        this._frame8 = new Uint8ClampedArray(this._frameAB);
        this._imageData = new ImageData(this._frame8, w, h);
      }

      const out32 = this._frame32;

      let outIndex = 0;

      // Precompute sky color once (packed)
      const SKY = (255 << 24) | (230 << 16) | (150 << 8) | 110; // light blue

      for (let y = 0; y < h; y++) {
        // SKY above horizon
        if (y < horizon) {
          const rowEnd = outIndex + w;
          while (outIndex < rowEnd) out32[outIndex++] = SKY;
          continue;
        }

        const dy = y - horizon;
        const distance = scaleConst / dy;

        // Row direction
        const rowDx = cosA * distance;
        const rowDy = sinA * distance;

        // Horizontal (right) direction
        const rightDx = -sinA * distance * fov;
        const rightDy = cosA * distance * fov;

        // Start of scanline (left edge in world)
        let worldX = cameraX + rowDx - rightDx;
        let worldY = cameraY + rowDy - rightDy;

        // Step per pixel across the scanline
        const stepX = (rightDx * 2) / w;
        const stepY = (rightDy * 2) / w;

        // Fixed-point versions for fast inner loop
        let wx = (worldX * ONE) | 0;
        let wy = (worldY * ONE) | 0;
        const sx = (stepX * ONE) | 0;
        const sy = (stepY * ONE) | 0;

        // Inner loop: NO floats, NO %, NO function calls
        for (let x = 0; x < w; x++) {
          let tx = wx >> FP;
          let ty = wy >> FP;

          // Fast wrap (handles negatives, avoids %)
          // equivalent to ((tx % texW)+texW)%texW but cheaper
          if (tx >= texW) tx -= texW * ((tx / texW) | 0);
          else if (tx < 0) tx += texW * ((-tx / texW + 1) | 0);

          if (ty >= texH) ty -= texH * ((ty / texH) | 0);
          else if (ty < 0) ty += texH * ((-ty / texH + 1) | 0);

          out32[outIndex++] = tex32[ty * texW + tx];

          wx += sx;
          wy += sy;
        }
      }

      ctx.putImageData(this._imageData, 0, 0);
    },
    render() {
      //this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      this.renderMode7Fast();

      // draw the car on top (screen position)
      this.ctx.save();

      const carSize = 100;
      this.ctx.translate(this.canvasWidth / 2, this.canvasHeight * 0.75);
      if (this.steer > 0.5) {
        this.ctx.drawImage(this.carRightImg, -carSize / 2, -carSize / 2, carSize, carSize);
      } else if (this.steer < -0.5) {
        this.ctx.drawImage(this.carLeftImg, -carSize / 2, -carSize / 2, carSize, carSize);
      } else {
        this.ctx.drawImage(this.carImg, -carSize / 2, -carSize / 2, carSize, carSize);
      }

      this.ctx.restore();

      this.ctx.drawImage(this.trackImg, 0, 0, 250, 250);

      this.ctx.beginPath();
      this.ctx.arc((this.car.x / this.trackImg.width) * 250, (this.car.y / this.trackImg.height) * 250, 1, 0, 2 * Math.PI);
      this.ctx.fill();
    },
  },
};
</script>

<style scoped>
canvas {
  border: 2px solid black;
  display: block;
  margin-top: 1rem;
  width: 700px;
  height: 700px;
}
</style>
