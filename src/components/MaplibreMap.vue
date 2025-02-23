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
    </div>
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
    const layers = ref([
      { id: 'properties-polygons', name: 'Properties', visible: true },
      { id: 'landuse-polygons', name: 'Land Use', visible: true },
      { id: 'borough-border', name: 'Borough Border', visible: true },
    ]);
    const currentStyle = ref('default');

    const toggleLayersMenu = () => {
      layersMenuOpen.value = !layersMenuOpen.value;
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
      map.value.fitBounds([[-75.167558, 40.286788], [-75.084817, 40.343006]]); // Replace with your original extent coordinates
    };

    const setMapStyleWithUpdate = (style) => {
      currentStyle.value = style;
      setMapStyle(style);
    };

    return { mapContainer, selectedProperty, layersMenuOpen, layers, toggleLayersMenu, toggleLayerVisibility, handleSidebarClose, setMapStyle: setMapStyleWithUpdate, currentStyle };
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
