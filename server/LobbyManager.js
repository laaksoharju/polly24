import { Lobby } from "./Lobby.js";
import { RacingGame } from "./RacingGame.js";

export class LobbyManager {
  constructor(io) {
    this.io = io;

    const testLobby = new Lobby(io, "test");
    testLobby.currentGame = new RacingGame();
    testLobby.phase = "game";
    this.lobbies = [testLobby];
  }

  createLobby() {
    const id = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    //TODO: Check for collisions
    const lobby = new Lobby(this.io, id);

    this.lobbies.push(lobby);
  }

  joinLobby() {}

  getLobby(lobbyId) {
    return this.lobbies.find((x) => x.id == lobbyId);
  }
}
