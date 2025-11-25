<template>
  <div style="padding: 0 4rem">
    <h1>Drink n' Draw</h1>
    <div style="display: flex; flex-direction: column; gap: 1rem">
      <p>Alpha: {{ Math.round(alpha) }}</p>
      <p>Beta: {{ Math.round(beta) }}</p>
      <p>Gamma: {{ Math.round(gamma) }}</p>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
const socket = io("localhost:3000");

export default {
  name: "BowlingView",
  data: function () {
    return {
      alpha: 0,
      beta: 0,
      gamma: 0,
    };
  },
  created: function () {
    window.addEventListener("deviceorientation", (e) => {
      console.log(e.alpha, e.beta, e.gamma);
      this.alpha = e.alpha;
      this.beta = e.beta;
      this.gamma = e.gamma;
    });
  },
  methods: {
    participateInPoll: function () {
      socket.emit("participateInPoll", { pollId: this.pollId, name: this.userName });
      this.joined = true;
    },
  },
};
</script>
