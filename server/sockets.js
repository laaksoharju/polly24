function sockets(io, socket, lobbyManager) {
  //socket.on("joinMarioHost", function () {
  //  console.log("host");
  //  data.marioGame.hostSocket = socket;
  //});
  //
  //socket.on("joinMarioClient", function () {
  //  console.log("client");
  //  data.marioGame.clients.push(socket);
  //
  //  if (data.marioGame.hostSocket != null) {
  //    console.log("CLIENT");
  //    data.marioGame.hostSocket.emit("marioClient", socket.id);
  //  }
  //});

  socket.on("disconnect", function () {
    console.log("client disconnect: " + socket.id);
    //if (data.marioGame.hostSocket != null) {
    //  data.marioGame.hostSocket.emit("marioClientDisconnect", socket.id);
    //}
  });

  //socket.on("marioInput", function (input) {
  //  if (data.marioGame.hostSocket != null) {
  //    data.marioGame.hostSocket.emit("marioInput", input, socket.id);
  //  }
  //});

  socket.on("joinLobby", function (lobbyCode, name) {
    lobbyManager.getLobby(lobbyCode)?.onPlayerJoined(socket, name);
  });
  socket.on("joinLobbyHost", function (lobbyCode) {
    lobbyManager.getLobby(lobbyCode)?.onHostJoined(socket);
  });
  socket.on("disconnect", function () {
    lobbyManager.getLobby(socket.data.lobbyId)?.onPlayerDisconnected(socket.id);
  });
}

export { sockets };
