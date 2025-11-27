export class LobbyContext {
  constructor(socket, isHost, state) {
    this.state = state;
    this.isHost = isHost;
    this.socket = socket;
  }
}
