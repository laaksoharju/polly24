<template>
  <div style="padding: 0 4rem">
    <h1>Drink n' Draw</h1>
    <div style="display: flex; flex-direction: column; gap: 1rem">
      <SlotMachine></SlotMachine>
    </div>
  </div>
</template>

<script>
import SlotMachine from "../components/SlotMachine.vue";

export default {
  name: "SlotView",

  data() {
    return {
      state: "",
    };
  },
  components: { SlotMachine },
  async created() {},

  methods: {},
};
</script>
