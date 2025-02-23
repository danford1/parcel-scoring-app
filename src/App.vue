<script setup>
import MaplibreMap from './components/MaplibreMap.vue'
import './app.less'
</script>

<template>
  <div class="grid">
    <div class="header">
      <h1>Open Areas Index</h1>
    </div>
    <div class="map-area">
      <MaplibreMap />
    </div>
  </div>
</template>

<style scoped>
#app {
  text-align: center;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  max-width: none;
}
</style>
