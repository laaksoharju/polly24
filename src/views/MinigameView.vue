<template>
  <div v-if="context.isHost" class="container">
    <div class="title-bar">
      <h1>2.5D Racer</h1>
    </div>
    <div class="body-container">
      <div class="scoreboard-container">
        <p>Player 1</p>
        <p>Player 2</p>
        <p>Player 3</p>
      </div>
      <div class="minigame-container">
        <RacingView class="minigame" />
      </div>
    </div>
  </div>
  <div v-if="!context.isHost" class="client-container">
    <RacingControllerView />
  </div>
</template>

<script>
import { LobbyContext } from "../models/LobbyContext";
import RacingView from "./minigames/racing/RacingView.vue";
import RacingControllerView from "./minigames/racing/RacingControllerView.vue";

export default {
  name: "MinigameView",

  props: {
    context: LobbyContext,
  },
  data() {
    return {};
  },
  components: { RacingView, RacingControllerView },
  async created() {},

  methods: {},
};
</script>

<style scoped>
h1 {
  color: #cfc6c6;
  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
  font-size: 3rem;
}

.container {
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(90deg, #fdbb2d 0%, #3a1c71 100%);
  display: flex;
  flex-direction: column;
  padding: 5rem;
  gap: 1rem;
}

.client-container {
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
  display: flex;
}

.title-bar {
  padding: 2rem;
  margin: 0;
  text-align: start;
  background: linear-gradient(90deg, #4b6bb744 0%, #1828485f 100%);
}
.title-bar h1 {
  margin: 0;
}

.body-container {
  flex-grow: 1;
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.scoreboard-container {
  background: linear-gradient(90deg, #4b6bb744 0%, #1828485f 100%);
  min-width: 10rem;
}
.minigame-container {
  background: linear-gradient(90deg, #4b6bb744 0%, #1828485f 100%);
  flex-grow: 1;
}
.minigame {
  width: 100%;
  height: 100%;
}
</style>
