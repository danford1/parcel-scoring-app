<template>
  <transition name="slide">
    <div class="sidebar" v-if="selectedProperty">
      <sl-icon-button name="x" label="Close" class="close-btn" @click="closeSidebar"></sl-icon-button>
      <h2>Parcel: {{ selectedProperty.PARCEL_NUM }}</h2>
      <p><strong>Address:</strong> {{ selectedProperty.ADDRESS || 'N/A' }}</p>
      <p><strong>Municipality:</strong> {{ selectedProperty.MUNICIPALI || 'N/A' }}</p>
      <p><strong>Deed Area:</strong> {{ selectedProperty.DEED_AREA || 'N/A' }}</p>
      <p><strong>Owner:</strong> {{ selectedProperty.OWNER1 || 'N/A' }} 
         <span v-if="selectedProperty.OWNER2"> & {{ selectedProperty.OWNER2 }}</span>
      </p>
      <p><strong>Reason:</strong> {{ selectedProperty.Reason || 'N/A' }}</p>
    </div>
  </transition>
</template>

<script>

export default {
  props: {
    selectedProperty: Object,
  },
  methods: {
    closeSidebar() {
      this.$emit('isClosed');
    },
  },
};
</script>

<style>
.sidebar {
  width: 300px;
  background: #fff;
  padding: 15px;
  border-right: 2px solid #ccc;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.sidebar h2 {
  margin-top: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  float: right;
  cursor: pointer;
}

.close-btn:hover {
  color: red;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease, width 0.3s ease;
}

.slide-enter, .slide-leave-to {
  transform: translateX(-100%);
}
</style>
