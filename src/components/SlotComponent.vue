<template>
  <div class="slot-background">
    <div class="slot-machine">
      <div class="top-body">
        <div>
          <span class="label">MINIGAMES</span>
        </div>
      </div>
      <div class="main-body">
        <div class="reels">
          <svg class="reel-arrow reel-arrow-left" viewBox="0 0 100 100" width="100%" height="100%">
            <polygon points="0,50 25,0 100,50 25,100" fill="red" />
          </svg>
          <SlotReel ref="reel1" />
          <SlotReel ref="reel2" />
          <SlotReel ref="reel3" />
          <svg class="reel-arrow reel-arrow-right" viewBox="0 0 100 100" width="100%" height="100%">
            <polygon points="0,50 25,0 100,50 25,100" fill="red" />
          </svg>
        </div>
        <div class="display">
          <span class="label">DRINK BEER!!!</span>
        </div>
      </div>
      <button class="spin-button" @click="spin">SPIN</button>
    </div>
  </div>
</template>

<script>
import SlotReel from "./SlotReel.vue";

export default {
  name: "SlotMachine",

  components: {
    SlotReel,
  },

  data() {
    return {};
  },

  methods: {
    spin() {
      console.log("SPIN");

      const symbolIndex = 1;

      console.log("Current spin 1: " + this.$refs.reel1.currentPos);
      console.log("Current spin 2: " + this.$refs.reel2.currentPos);
      console.log("Current spin 3: " + this.$refs.reel3.currentPos);

      const symbolsToRotate1 = this.$refs.reel1.availableSymbols.length * 5 + (this.$refs.reel1.currentPos - symbolIndex);
      const symbolsToRotate2 = this.$refs.reel2.availableSymbols.length * 6 + (this.$refs.reel2.currentPos - symbolIndex);
      const symbolsToRotate3 = this.$refs.reel3.availableSymbols.length * 7 + (this.$refs.reel3.currentPos - symbolIndex);

      this.$refs.reel1.spin(Date.now(), symbolsToRotate1, 25);
      this.$refs.reel2.spin(Date.now(), symbolsToRotate2, 25);
      this.$refs.reel3.spin(Date.now(), symbolsToRotate3, 25);
    },
  },
};
</script>

<style scoped>
.slot-machine {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.slot-background {
  /*background: url(https://t3.ftcdn.net/jpg/04/72/67/22/360_F_472672271_upGkFlomQbzdTQ6G4T8jZCYxZELhrhle.jpg);*/
  background-image: url("https://emv586mw5ad.exactdn.com/en/blog/wp-content/uploads/2024/09/A-gold-slot-machine-with-three-red-sevens-Online-jackpot-slots.jpg?strip=all&lossy=1&ssl=1");
  background-position: center -80px;
  background-size: 870px;
  width: 700px;
  height: 500px;
  justify-items: center;
  align-content: center;
}

.top-body {
  width: 80%;
  aspect-ratio: 2/1;
  overflow: hidden;
}
.top-body div {
  background: #2e0f00;
  width: calc(100%-2rem);
  aspect-ratio: 1;
  border: 1rem solid goldenrod;
  border-style: ridge;
  border-radius: 50% 50% 0 0;
  overflow: hidden;
}
.top-body span {
  height: 100%;
  display: block;
  transform: translateY(20%);
}

.main-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(#2e0f00, #472c1e);

  border: 1rem solid goldenrod;
  border-style: ridge;
  border-radius: 1rem;
}

.reels {
  position: relative;
  display: flex;
  gap: 1rem;
  border: 1rem solid goldenrod;
  border-style: ridge;
  border-radius: 1rem;
}
.reel-arrow {
  position: absolute;
  top: 50%;
  width: 2rem;
  height: 2rem;
  z-index: 100;
  transform: translateY(-50%);
  filter: drop-shadow(0 0 8px red);
}
.reel-arrow-left {
  left: -20px;
}
.reel-arrow-right {
  right: -20px;
  transform: translateY(-50%) rotateZ(180deg);
}

.display {
  background-color: #242527;
  border: 1rem solid #54544c;
  border-style: ridge;
  border-radius: 1rem;
}

.label {
  color: #f7d67e;
  font-size: 32px;
  font-weight: 900;
  -webkit-text-stroke: 1px #5d3b00;
  text-shadow: 0 0 10px #0007;
}

.spin-button {
  background-color: gold;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1.2rem;
}

.spin-button:hover {
  background: orange;
}
</style>
