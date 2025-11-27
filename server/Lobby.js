import { Player } from "./models/Player.js";

export class Lobby {
  constructor(io, lobbyId) {
    this.io = io;
    this.id = lobbyId;
    this.currentGame = null;
    this.phase = "lobby";
    this.players = [];
  }

  onPlayerJoined(socket, name) {
    socket.join(this.id + "_PLAYERS");
    socket.data.lobbyId = this.id;
    socket.emit("joinLobbyResponse", this.id);
    this.players.push(new Player(name, socket.id));
    this.broadcastLobbyState();
  }

  onHostJoined(socket) {
    socket.join(this.id + "_HOST");
    socket.data.lobbyId = this.id;
    socket.emit("joinLobbyHostResponse", this.id);
    this.broadcastLobbyState();
  }

  onPlayerDisconnected(playerId) {
    this.players = this.players.filter((x) => x.id != playerId);
    this.broadcastLobbyState();
  }

  start() {
    this.startRound();
  }

  startRound() {
    this.startGameSelection();
  }

  startGameSelection() {
    const gameIndex = 0; /* Select random minigame */

    setTimeout(this.startLoadingScreen, 3000);
  }

  startLoadingScreen() {
    setTimeout(this.startLoadingScreen, 10000);
  }

  startMinigame() {
    this.currentGame.onFinished = this.onMinigameFinished;
    this.currentGame.start();
  }

  onMinigameFinished() {}

  /* COMMUNICATION */

  setState() {}

  broadcastLobbyState() {
    const state = {
      players: this.players,
      phase: this.phase,
    };

    this.io.to(this.id + "_PLAYERS").emit("updateLobbyState", state);
    this.io.to(this.id + "_HOST").emit("updateLobbyState", state);
  }

  /*
   * Lobby/Settings view
   *
   * ->  Run slot machine (select minigame)
   * |   Show loading screen (with tips about the following minigame)
   * |   Start minigame
   * |   Wait for minigame to finish
   * |   Show result
   * |_______|
   */
}
