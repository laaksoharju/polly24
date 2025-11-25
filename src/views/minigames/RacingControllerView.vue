<template>
  <div class="controller" :class="(useJoystick ? 'joystick-mode ' : 'gyro-mode ') + (isPortrait ? 'force-landscape' : '')">
    <div v-if="useJoystick" class="joystick-container">
      <div class="joystick-holder" @touchstart="onJoyStart" @touchmove.prevent="onJoyMove" @touchend="onJoyEnd">
        <div
          class="joystick"
          :style="{
            transform: `translate(${joystick.x}px, ${joystick.y}px)`,
          }"
        ></div>
      </div>
    </div>
    <div class="info">
      <div></div>
      <div>
        <p>A: {{ alpha?.toFixed(0) }} B: {{ beta?.toFixed(0) }} G: {{ gamma?.toFixed(0) }}</p>
        <p>Steer: {{ steer?.toFixed(2) }}</p>
        <p>Gas: {{ gasPressed }}</p>
      </div>
      <div>
        <button @click="connect">Reconnect</button>
        <button @click="requestSensorPermission">Enable Motion</button>
        <button @click="useJoystick = !useJoystick">{{ useJoystick ? "Gyro mode" : "Joystick mode" }}</button>
      </div>
    </div>

    <div class="pedals">
      <button class="pedal brake" @touchstart="brake(1)" @touchend="brake(0)">BRAKE</button>
      <button class="pedal gas" @touchstart="gas(1)" @touchend="gas(0)">GAS</button>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";

const DEG2RAD = Math.PI / 180;

export default {
  name: "RacingController",

  data() {
    return {
      socket: null,
      useJoystick: true,

      joystick: {
        active: false,
        startX: 0,
        startY: 0,
        x: 0,
        y: 0,
        max: 80,
      },

      isPortrait: window.matchMedia("(orientation: portrait)").matches,
      alpha: 0,
      beta: 0,
      gamma: 0,

      roll: 0,
      steer: 0,
      gasPressed: 0,
      brakePressed: 0,
    };
  },

  created: function () {
    this.socket = io();

    this.socket.emit("joinMarioClient");
  },

  async mounted() {
    window.addEventListener("deviceorientation", this.handleRotation);
    window.matchMedia("(orientation: portrait)").addEventListener("change", (e) => {
      this.isPortrait = e.matches;
    });
  },
  beforeUnmount() {
    window.removeEventListener("deviceorientation", this.handleOrientation);
  },
  methods: {
    connect() {
      this.socket.disconnect();
      this.socket = io();
      this.socket.emit("joinMarioClient");
    },
    async enterLandscape() {
      try {
        // FULLSCREEN FIRST
        await document.documentElement.requestFullscreen();

        // MUST be inside the same user gesture
        await screen.orientation.lock("landscape");

        console.log("Landscape lock OK");
      } catch (err) {
        console.warn("Orientation lock failed:", err);
      }
    },
    async requestSensorPermission() {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
          const response = await DeviceOrientationEvent.requestPermission();
          if (response === "granted") {
            window.addEventListener("deviceorientation", this.handleRotation, true);
            console.log("iOS motion enabled");
          } else {
            alert("Motion permission denied");
          }
        } catch (err) {
          console.error("Error requesting permission", err);
        }
      }
    },
    handleRotation(e) {
      if (this.useJoystick) return;
      this.alpha = e.alpha;
      this.beta = e.beta;
      this.gamma = e.gamma;

      const alpha = e.alpha || 0;
      const beta = e.beta || 0;
      const gamma = e.gamma || 0;

      let roll = (beta * (1 - gamma / 180)) / 60;

      roll = Math.min(Math.max(roll, -1), 1);

      this.steer = roll;
      this.roll = roll;
      this.sendInput();
    },
    gas(val) {
      this.enterLandscape();
      this.gasPressed = val;
      this.sendInput();
    },

    brake(val) {
      this.brakePressed = val;
      this.sendInput();
    },

    onJoyStart(e) {
      if (!this.useJoystick) return;
      const touch = e.touches[0];
      this.joystick.active = true;
      this.joystick.startX = touch.clientX;
      this.joystick.startY = touch.clientY;
    },

    onJoyMove(e) {
      if (!this.useJoystick) return;
      if (!this.joystick.active) return;
      const touch = e.touches[0];

      const dx = touch.clientX - this.joystick.startX;
      const dy = touch.clientY - this.joystick.startY;

      // clamp inside circle
      const dist = Math.sqrt(dx * dx + dy * dy);
      const max = this.joystick.max;

      let nx = dx,
        ny = dy;
      if (dist > max) {
        const ratio = max / dist;
        nx *= ratio;
        ny *= ratio;
      }

      this.joystick.x = nx;
      this.joystick.y = ny;

      // STEERING = horizontal axis normalized (-1 to 1)
      this.steer = nx / max;

      this.sendInput();
    },

    onJoyEnd() {
      if (!this.useJoystick) return;
      this.joystick.active = false;
      this.joystick.x = 0;
      this.joystick.y = 0;
      this.steer = 0;
      this.sendInput();
    },

    sendInput() {
      this.socket.emit("marioInput", {
        steer: this.steer,
        gas: this.gasPressed,
        brake: this.brakePressed,
      });
    },
  },
};
</script>

<style scoped>
.controller {
  width: 100vw;
  height: 100vh;
  background: rgb(156, 76, 76);
  user-select: none;
  touch-action: none;
}

.gyro-mode {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.joystick-mode {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
}

.force-landscape {
  position: absolute;
  top: 0;
  left: 100vw;
  width: 100vh;
  height: 100vw;
  transform: rotate(90deg);
  transform-origin: top left;
  overflow: hidden;
}

.joystick-container {
  align-content: center;
  justify-items: center;
}
.joystick-holder {
  width: 8rem;
  height: 8rem;
  align-content: center;
  justify-items: center;
  border-radius: 50%;
  background-color: #484041;
}
.joystick {
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  background-color: #e63946;
}

.gyro-mode .pedals {
  display: flex;
  width: 100%;
  height: 50%;
}

.joystick-mode .pedals {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.pedal {
  flex: 1;
  font-size: 3rem;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brake {
  background: #e63946;
  color: white;
}

.gas {
  background: #06d6a0;
  color: white;
}

.joystick-mode .info {
  display: grid;
  width: 100%;
  grid-template-rows: 1fr 1fr 1fr;
  color: white;
  text-align: center;
  padding-top: 1rem;
}

.gyro-mode .info {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr 1fr;
  color: white;
  text-align: center;
  padding-top: 1rem;
}

.info button {
  border: 1px solid black;
  border-radius: 10px;
  padding: 0.5rem;
}
</style>
