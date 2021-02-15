<template>
  <Main />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Main from "./views/Main.vue";

export default defineComponent({
  name: "App",
  components: {
    Main,
  },
});
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>