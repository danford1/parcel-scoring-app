import { ref, onMounted } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

export function useMap(mapContainer) {
  const map = ref(null);
  const selectedProperty = ref(null);

  const geojsonFiles = [
    {
      name: 'properties',
      url: '/open-areas-inventory-map/data/properties.geojson',
      layerType: 'fill',
      styleByAttribute: 'Reason',
      colorMapping: {
        'Borough owned, Municipal Park, Riparian Buffer': '#ff6600',
        'Borough owned, Municipal Open Space': '#0066ff',
        'Bucks County Municipal Open Space Program Easement (Preserved)': '#00cc66',
      },
    },
    {
      name: 'landuse',
      url: '/open-areas-inventory-map/data/landuse.geojson',
      layerType: 'fill',
      styleByAttribute: 'LUP1CATN',
      colorMapping: {
        'Agriculture': '#979c89',
        'Commercial': '#7e6d42',
        'Community Services': '#536d37',
        'Manufacturing': '#6c6c6c',
        'Military': '#6c6c6c',
        'Mining': '#6c6c6c',
        'Parking: Agriculture': '#4f4f4f',
        'Parking: Commercial': '#4f4f4f',
        'Parking: Community Services': '#4f4f4f',
        'Parking: Manufacturing': '#4f4f4f',
        'Parking: Military': '#4f4f4f',
        'Parking: Mining': '#4f4f4f',
        'Parking: Mobile Home': '#4f4f4f',
        'Parking: Multi-Family': '#4f4f4f',
        'Parking: Recreation': '#4f4f4f',
        'Parking: Transportation': '#4f4f4f',
        'Parking: Utility': '#4f4f4f',
        'Recreation': '#337759',
        'Residential: Mobile Home': '#738e7c',
        'Residential: Multi-Family': '#738e7c',
        'Residential: Single-Family': '#738e7c',
        'Transportation': '#6d6d6d',
        'Utility': '#8f8467',
        'Vacant': '#8b866d',
        'Water': '#0090b6',
        'Wooded': '#225e44',        
      },
    },
    {
      name: 'borough',
      url: '/open-areas-inventory-map/data/borough.geojson',
      layerType: 'outline',
      lineColor: '#000000',
      lineWidth: 3,
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
      maxBounds: bounds,
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
            id: `${file.name}-border`,
            type: 'line',
            source: file.name,
            paint: {
              'line-color': file.lineColor,
              'line-width': file.lineWidth,
            },
          });
        } else if (file.layerType === 'fill') {
          map.value.addLayer({
            id: `${file.name}-polygons`,
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

          if (file.name === 'properties') {
            map.value.on('click', `${file.name}-polygons`, (e) => {
              selectedProperty.value = e.features[0].properties;

              // Zoom to the selected feature
              const bbox = turf.bbox(e.features[0]);
              map.value.fitBounds(bbox, {
                padding: 100,
              });
            });

            map.value.on('mouseenter', `${file.name}-polygons`, () => {
              map.value.getCanvas().style.cursor = 'pointer';
            });
            map.value.on('mouseleave', `${file.name}-polygons`, () => {
              map.value.getCanvas().style.cursor = '';
            });
          }
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
