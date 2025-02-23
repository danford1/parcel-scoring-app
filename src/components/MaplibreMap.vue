<template>
  <div class="map-container" :class="{ 'sidebar-open': selectedProperty }">
    <Sidebar :selectedProperty="selectedProperty" @isClosed="handleSidebarClose" />
    <div ref="mapContainer" class="map">
      <div class="map-controls">
        <sl-icon-button name="layers" label="Layers" @click="toggleLayersMenu"></sl-icon-button>
        <sl-menu v-if="layersMenuOpen" class="layers-menu">
          <sl-button-group>
            <sl-button :variant="currentStyle === 'default' ? 'primary' : 'default'" @click="setMapStyle('default')">Default</sl-button>
            <sl-button :variant="currentStyle === 'satellite' ? 'primary' : 'default'" @click="setMapStyle('satellite')">Satellite</sl-button>
          </sl-button-group>
          <sl-menu-item v-for="layer in layers" :key="layer.id">
            <sl-switch :checked="layer.visible" @sl-change="toggleLayerVisibility(layer.id, $event.target.checked)">
              {{ layer.name }}
            </sl-switch>
          </sl-menu-item>
        </sl-menu>
      </div>
      <div class="weight-controls">
        <sl-icon-button name="sliders" label="Adjust Weights" @click="toggleWeightsPopup"></sl-icon-button>
      </div>
    </div>

    <sl-dialog label="Adjust Scoring Weights" :open="weightsPopupOpen" @sl-request-close="weightsPopupOpen = false">

      <div style="padding: 10px;">
        <h3>Adjust Scoring Weights</h3>
        <label>Walking Accessibility: {{ weights.walking.toFixed(2) }}</label>
        <input type="range" v-model="weights.walking" min="0" max="1" step="0.01" />
        <label>School Proximity: {{ weights.school.toFixed(2) }}</label>
        <input type="range" v-model="weights.school" min="0" max="1" step="0.01" />
        <label>Lot Size: {{ weights.lotSize.toFixed(2) }}</label>
        <input type="range" v-model="weights.lotSize" min="0" max="1" step="0.01" />
      </div>
        
      <div slot="footer" class="dialog-footer">
          <sl-button
            pill
            variant="default"
            @click="onCancel"
          >
          Cancel
          </sl-button>

          <sl-button
            pill
            variant="primary"
            :disabled="!canExecute"
            @click="onExecute"
          >
          Save
          </sl-button>
          
      </div>
    </sl-dialog>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useMap } from '../composables/useMap';
import Sidebar from './Sidebar.vue';

export default {
  components: {
    Sidebar,
  },
  setup() {
    const mapContainer = ref(null);
    const { map, selectedProperty, setMapStyle } = useMap(mapContainer);
    const layersMenuOpen = ref(false);
    const weightsPopupOpen = ref(false);
    const layers = ref([
      { id: 'parcels-scored', name: 'Parcels', visible: true },
      { id: 'walking-isochrones', name: 'Walking Time', visible: true },
      { id: 'elementary-school-zones', name: 'Elementary School Zones', visible: true },
      { id: 'borough', name: 'Borough Boundary', visible: true },
    ]);
    const currentStyle = ref('default');

    const toggleLayersMenu = () => {
      layersMenuOpen.value = !layersMenuOpen.value;
    };
    
    const toggleWeightsPopup = () => {
      weightsPopupOpen.value = !weightsPopupOpen.value;
    };

    const toggleLayerVisibility = (layerId, visible) => {
      const layer = layers.value.find(l => l.id === layerId);
      if (layer) {
        layer.visible = visible;
        map.value.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    const handleSidebarClose = () => {
      selectedProperty.value = null;
    };

    const setMapStyleWithUpdate = (style) => {
      currentStyle.value = style;
      setMapStyle(style);
    };
    return {
      mapContainer,
      selectedProperty,
      layersMenuOpen,
      weightsPopupOpen,
      layers,
      toggleLayersMenu,
      toggleWeightsPopup,
      toggleLayerVisibility,
      handleSidebarClose,
      setMapStyle: setMapStyleWithUpdate, 
      currentStyle
    };
  },
};
</script>

<style>
.map-container {
  position: relative;
  display: flex;
  width: 100%;
  height: 100vh;
  transition: width 0.3s ease;
}

.map-container.sidebar-open .map {
  width: calc(100% - 300px);
}

.map {
  flex-grow: 1;
  transition: width 0.3s ease;
}

.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9;
}

.weight-controls {
  position: absolute;
  top: 10px;
  left: 50px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

sl-icon-button::part(base) {
  background-color: white;
}

.layers-menu {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
  background: white;
  color: black;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>
