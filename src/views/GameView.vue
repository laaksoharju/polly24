<template>
  <div class="debug-box">
    <p>Connected: {{ isConnected }}</p>
    <p>Phase: {{ context.state?.phase ?? "undefined" }}</p>
    <p>Host: {{ context.isHost }}</p>
    <p>Players: {{ context.state?.players.map((x) => x.name) }}</p>
  </div>
  <div v-if="!isConnected">
    <div class="connection-warning">
      <div>
        <p>Not connected</p>
        <button @click="joinLobby('test', 'player_' + Math.floor(Math.random() * 1000))">Join test lobby as player</button>
        <br />
        <button @click="joinLobbyAsHost('test')">Join test lobby as host</button>
      </div>
    </div>
  </div>
  <div v-if="isConnected">
    <LobbyView v-if="context.state?.phase == 'lobby'" :context="context" />
    <SlotView v-if="context.state?.phase == 'slot'" :context="context" />
    <LoadingView v-if="context.state?.phase == 'loading'" :context="context" />
    <MinigameView v-if="context.state?.phase == 'game'" :context="context" />
    <ResultView v-if="context.state?.phase == 'result'" :context="context" />
  </div>
</template>

<script>
import LoadingView from "./LoadingView.vue";
import MinigameView from "./MinigameView.vue";
import SlotView from "./SlotView.vue";
import ResultView from "./ResultView.vue";
import LobbyView from "./LobbyView.vue";
import io from "socket.io-client";
import { LobbyContext } from "../models/LobbyContext";

const socket = io();

export default {
  name: "GameView",

  data() {
    return {
      //state: "lobby",
      isConnected: false,
      context: new LobbyContext(socket, false, undefined),
    };
  },
  components: { MinigameView, LoadingView, SlotView, ResultView, LobbyView },
  mounted() {
    socket.on("joinLobbyResponse", (response) => {
      console.log("resp");
      this.context.isHost = false;
      this.isConnected = true;
    });
    socket.on("joinLobbyHostResponse", (response) => {
      console.log("resp");
      this.context.isHost = true;
      this.isConnected = true;
    });
    socket.on("updateLobbyState", (state) => {
      console.log("state update");
      this.context.state = state;
    });
  },
  beforeUnmount() {
    socket.off("joinLobbyResponse");
    socket.off("updateLobbyState");
  },
  methods: {
    joinLobby(lobbyId, name) {
      socket.emit("joinLobby", lobbyId, name);
    },
    joinLobbyAsHost(lobbyId) {
      socket.emit("joinLobbyHost", lobbyId);
    },
  },
};
</script>

<style scoped>
.connection-warning {
  width: 100vw;
  height: 100vh;
  justify-items: center;
  align-content: center;
}
.connection-warning > div {
  width: 30vw;
  height: 30vh;
  align-items: center;
  align-content: center;
  background-color: red;
  color: white;
}

.debug-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  left: 1rem;
  top: 1rem;
  padding: 0.5rem;
  gap: 0.5rem;
  background-color: #8a303056;
  color: white;
}
.debug-box p {
  margin: 0;
}
</style>
