<template>
  <div>LoBBY</div>
</template>

<script>
import io, { Socket } from "socket.io-client";

export default {
  name: "LobbyView",
  props: {
    socket: Socket,
  },
  data: function () {
    return {};
  },
  created: function () {},
  methods: {},
};
</script>
