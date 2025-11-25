<template>
  <div>
    <p>Pos: x: {{ car?.x?.toFixed(2) }} y: {{ car?.y?.toFixed(2) }}</p>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import trackURL from "@/assets/track_1.png";
import trackMaskURL from "@/assets/track_1_mask.png";
import carURL from "@/assets/car_2.png";
import carLeftURL from "@/assets/car_2_left.png";
import carRightURL from "@/assets/car_2_right.png";

import trackStraight0URL from "@/assets/track_straight_0.png";
import trackStraight1URL from "@/assets/track_straight_1.png";
import trackCurve0URL from "@/assets/track_curve_0.png";
import trackCurve1URL from "@/assets/track_curve_1.png";
import trackCurve2URL from "@/assets/track_curve_2.png";
import trackCurve3URL from "@/assets/track_curve_3.png";
import trackEmptyURL from "@/assets/track_empty.png";

export default {
  name: "RacingCanvas",

  data() {
    return {
      canvasWidth: 768,
      canvasHeight: 768,
      ctx: null,
    };
  },
  props: {
    car: Object,
    otherCars: Array,
    place: Number,
    playerCount: Number,
    time: Number,
    track: Object,
  },
  async mounted() {
    this.trackImg = await this.loadImage(trackURL);
    this.trackMaskImg = await this.loadImage(trackMaskURL);
    this.carImg = await this.loadImage(carURL);
    this.carLeftImg = await this.loadImage(carLeftURL);
    this.carRightImg = await this.loadImage(carRightURL);

    this.trackStraight0Img = await this.loadImage(trackStraight0URL);
    this.trackStraight1Img = await this.loadImage(trackStraight1URL);
    this.trackCurve0Img = await this.loadImage(trackCurve0URL);
    this.trackCurve1Img = await this.loadImage(trackCurve1URL);
    this.trackCurve2Img = await this.loadImage(trackCurve2URL);
    this.trackCurve3Img = await this.loadImage(trackCurve3URL);
    this.trackEmptyImg = await this.loadImage(trackEmptyURL);

    console.log(this.trackImg);

    const canvas = this.$refs.canvas;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.ctx = canvas.getContext("2d");

    console.log(this.track);
    this.generateTrackTexture(this.track.data, this.track.width, this.track.height);
    //this.prepareTexture(this.trackImg);
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
    getGameraPos() {
      const cameraX = this.car.x - Math.cos(this.car.angle) * 25;
      const cameraY = this.car.y - Math.sin(this.car.angle) * 25;

      return { cameraX, cameraY };
    },
    generateTrackTexture(track, width, height) {
      const imgW = width * 128;
      const imgH = height * 128;
      const texCanvas = document.createElement("canvas");
      texCanvas.width = imgW;
      texCanvas.height = imgH;
      const texCtx = texCanvas.getContext("2d", { willReadFrequently: true });

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          switch (track[y][x]) {
            case "#":
              texCtx.drawImage(this.trackEmptyImg, 128 * x, 128 * y);
              break;
            case "─":
              texCtx.drawImage(this.trackStraight0Img, 128 * x, 128 * y);
              break;
            case "│":
              texCtx.drawImage(this.trackStraight1Img, 128 * x, 128 * y);
              break;
            case "┌":
              texCtx.drawImage(this.trackCurve0Img, 128 * x, 128 * y);
              break;
            case "┐":
              texCtx.drawImage(this.trackCurve1Img, 128 * x, 128 * y);
              break;
            case "┘":
              texCtx.drawImage(this.trackCurve2Img, 128 * x, 128 * y);
              break;
            case "└":
              texCtx.drawImage(this.trackCurve3Img, 128 * x, 128 * y);
              break;
          }
        }
      }

      this.trackImg = new Image();
      this.trackImg.src = texCanvas.toDataURL("image/png");

      const texData8 = texCtx.getImageData(0, 0, imgW, imgH).data;
      const tex32 = new Uint32Array(imgW * imgH);

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
    worldToScreen(objX, objY, cameraX, cameraY, cameraAngle, w, h) {
      const dx = objX - cameraX;
      const dy = objY - cameraY;

      const sinA = Math.sin(cameraAngle);
      const cosA = Math.cos(cameraAngle);

      // camera space aligned with your Mode7
      const ry = dx * cosA + dy * sinA; // forward
      const rx = -dx * sinA + dy * cosA; // right

      const horizon = h * 0.45;
      const scaleConst = 5000;
      const fov = 1.2;

      const NEAR = 20;
      if (ry < NEAR) return null;

      // vertical matches floor: dy_screen = scaleConst/ry
      const p = scaleConst / ry;
      const screenY = horizon + p;

      // ✅ horizontal matches floor EXACTLY
      const screenX = w * 0.5 + (rx / (ry * fov)) * (w * 0.5);

      // size ~ perspective
      const size = p * 0.5;

      return { screenX, screenY, size };
    },
    renderMode7Fast() {
      const ctx = this.ctx;
      const w = this.canvasWidth;
      const h = this.canvasHeight;

      const tex32 = this._tex32;
      const texW = this._texW;
      const texH = this._texH;
      if (!tex32) return; // texture not ready

      // --- Camera / params ---
      const { cameraX, cameraY } = this.getGameraPos();
      const cameraAngle = this.car.angle;

      const horizon = (h * 0.45) | 0;
      const scaleConst = 5000;
      const fov = 1.2;

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
    renderPlayer(x, y, steer) {
      const { cameraX, cameraY } = this.getGameraPos();

      const scr = this.worldToScreen(x, y, cameraX, cameraY, this.car.angle, this.canvasWidth, this.canvasHeight);

      if (scr) {
        const { screenX, screenY, size } = scr;
        this.ctx.drawImage(
          steer > 0.5 ? this.carRightImg : steer < -0.5 ? this.carLeftImg : this.carImg,
          screenX - size / 2,
          screenY - size / 2,
          size,
          size
        );
      }
    },
    renderMiniMap() {
      const minimapTileSize = 32;
      const minimapW = this.track.width * minimapTileSize;
      const minimapH = this.track.height * minimapTileSize;

      this.ctx.drawImage(this.trackImg, 0, 0, minimapW, minimapH);
      this.ctx.fillStyle = "yellow";
      this.ctx.beginPath();
      this.ctx.arc((this.car.x / this.trackImg.width) * minimapW, (this.car.y / this.trackImg.height) * minimapH, 3, 0, 2 * Math.PI);
      this.ctx.fill();

      if (true /* DEBUG */) {
        for (let i = 0; i < this.track.route.length; i++) {
          this.ctx.fillStyle = "#ff0000a0";
          const routeTile = this.track.route[i];
          this.ctx.fillRect(routeTile.x * minimapTileSize, routeTile.y * minimapTileSize, minimapTileSize, minimapTileSize);
          this.ctx.fillStyle = "white";
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";
          this.ctx.font = `${minimapTileSize}px 'VT323'`;
          this.ctx.fillText(`${i + 1}`, (routeTile.x + 0.5) * minimapTileSize, (routeTile.y + 0.5) * minimapTileSize);
        }

        for (let i = 0; i < this.car.tilesStack.length; i++) {
          this.ctx.fillStyle = "#0000ffa0";
          const routeTile = this.car.tilesStack[i];
          this.ctx.fillRect(routeTile.x * minimapTileSize, routeTile.y * minimapTileSize, minimapTileSize, minimapTileSize);
          this.ctx.fillStyle = "white";
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";
          this.ctx.font = `${minimapTileSize}px 'VT323'`;
          this.ctx.fillText(`${i + 1}`, (routeTile.x + 0.5) * minimapTileSize, (routeTile.y + 0.5) * minimapTileSize);
        }
      }
    },
    render() {
      if (!this.ctx) return;
      this.renderMode7Fast();

      for (let other of this.otherCars) {
        this.renderPlayer(other.x, other.y, other.input.steer);
      }

      this.renderMiniMap();

      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "end";
      this.ctx.textBaseline = "top";
      this.ctx.font = "50px 'VT323'";
      this.ctx.fillText(`${this.place + 1}/${this.playerCount}`, this.canvasWidth - 10, 10);
      this.ctx.fillText(`${formatTime(this.time)}`, this.canvasWidth - 10, 60);
    },
  },
};

function formatTime(time) {
  let minutes = Math.floor(time / 60000);
  let seconds = Math.floor((time % 60000) / 1000);
  let tenths = Math.floor((time % 1000) / 100);
  return `${minutes}'${seconds}''${tenths}`;
}
</script>

<style scoped>
canvas {
  border: 2px solid black;
  display: block;
  margin-top: 1rem;
  width: 500px;
  height: 500px;
}
</style>
