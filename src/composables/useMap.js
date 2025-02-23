import { ref, onMounted } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

export function useMap(mapContainer) {
  const map = ref(null);
  const selectedProperty = ref(null);

  const geojsonFiles = [
    {
      name: 'elementary-school-zones',
      url: '/parcel-scoring-app/data/elementary_school_zones.geojson',
      layerType: 'fill',
      styleByAttribute: 'name',
      colorMapping: {
        'Doyle': '#0066ff',
        'Kutz': '#ff6600',
        'Linden': '#00cc66',
      },
    },
    {
      name: 'walking-isochrones',
      url: '/parcel-scoring-app/data/walking_isochrones.geojson',
      layerType: 'fill',
      styleByAttribute: 'AA_MINS',
      colorMapping: {
        '10': 'blue',
        '20': 'green',
        '30': 'yellow',
        '40': 'red',        
      },
    },
    {
      name: 'parcels',
      url: '/parcel-scoring-app/data/parcels.geojson',
    },
  ];

  const bounds = [
    [-75.167558, 40.286788],
    [-75.084817, 40.343006],
  ];

  const mapStyles = {
    satellite: {
      version: 8,
      sources: {
        'esri-imagery': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
        },
        'esri-hybrid-labels': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Labels &copy; <a href="https://www.esri.com/">Esri</a>',
        },
      },
      layers: [
        {
          id: 'esri-imagery-layer',
          type: 'raster',
          source: 'esri-imagery',
        },
        {
          id: 'esri-hybrid-labels-layer',
          type: 'raster',
          source: 'esri-hybrid-labels',
        },
      ],
    },
    default: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
        },
      ],
    },
  };

  onMounted(async () => {
    map.value = new maplibregl.Map({
      container: mapContainer.value,
      style: mapStyles.default,
      center: [-75.1299, 40.3101],
      zoom: 14,
      // maxBounds: bounds,
    });

    const nav = new maplibregl.NavigationControl();
    map.value.addControl(nav, 'top-right');

    const addGeojsonLayers = async () => {
      for (const file of geojsonFiles) {
        const response = await fetch(file.url);
        const geojsonData = await response.json();

        map.value.addSource(file.name, {
          type: 'geojson',
          data: geojsonData,
        });

        if (file.layerType === 'outline') {
          map.value.addLayer({
            id: file.name,
            type: 'line',
            source: file.name,
            paint: {
              'line-color': file.lineColor,
              'line-width': file.lineWidth,
            },
          });
        } else if (file.layerType === 'fill') {
          map.value.addLayer({
            id: file.name,
            type: 'fill',
            source: file.name,
            paint: {
              'fill-color': [
                'match',
                ['get', file.styleByAttribute],
                ...Object.entries(file.colorMapping).flat(),
                '#aaaaaa',
              ],
              'fill-opacity': 0.4,
              'fill-outline-color': '#000000',
            },
          });
        }

        if (file.name === 'parcels') {

            map.value.addLayer({
            id: file.name,
            type: 'fill',
            source: file.name,
            paint: {
              'fill-outline-color': '#000000',
              'fill-color': '#fff',
              'fill-opacity': 0.2,
            },
            });
          
          map.value.on('click', file.name, (e) => {
            selectedProperty.value = e.features[0].properties;

            // Zoom to the selected feature
            const bbox = turf.bbox(e.features[0]);
            map.value.fitBounds(bbox, {
              padding: 150,
            });
          });

          map.value.on('mouseenter', file.name, () => {
            map.value.getCanvas().style.cursor = 'pointer';
          });
          map.value.on('mouseleave', file.name, () => {
            map.value.getCanvas().style.cursor = '';
          });
        }
      }
    };

    map.value.on('load', addGeojsonLayers);
    map.value.on('styledata', addGeojsonLayers);
  });

  const setMapStyle = (style) => {
    map.value.setStyle(mapStyles[style]);
  };

  return { map, selectedProperty, setMapStyle };
}
