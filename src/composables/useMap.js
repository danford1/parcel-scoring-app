import { ref, onMounted } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

export function useMap(mapContainer) {
  const map = ref(null);
  const selectedProperty = ref(null);
  const weights = ref({ borough: 0.2, walking: 0.4, school: 0.1, lotSize: 0.3 });

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
    {
      name: 'borough',
      url: '/parcel-scoring-app/data/borough.geojson',
      layerType: 'outline',
      lineColor: '#000000',
      lineWidth: 2,
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

  const updateWeights = (newWeights) => {
    weights.value = { ...weights.value, ...newWeights };
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
          // Fetch additional GeoJSON data for scoring
          const parcels = geojsonData.features;

          // Function to normalize lot size (Acres)
          const normalizeLotSize = (acres) => Math.min(100, (acres / 5) * 100);

          // Apply scoring logic
          parcels.forEach(parcel => {
            let score = 0;

            // Lot Size Score
            const lotSize = parcel.properties.Acres || 0;
            const lotSizeScore = normalizeLotSize(lotSize);

            // Walking Accessibility Score
            let walkingScore = 0;
            const walkingIsochrones = geojsonFiles.find(f => f.name === 'walking-isochrones');

            // Ensure it's loaded before accessing features
            if (walkingIsochrones && walkingIsochrones.features) {
              walkingIsochrones.features.forEach(isochrone => {
                if (turf.booleanPointInPolygon(parcel, isochrone)) {
                  if (isochrone.properties.AA_MINS === '10') walkingScore = 100;
                  else if (isochrone.properties.AA_MINS === '20') walkingScore = 75;
                  else if (isochrone.properties.AA_MINS === '30') walkingScore = 50;
                  else if (isochrone.properties.AA_MINS === '40') walkingScore = 25;
                }
              });
            } else {
              console.warn("Walking isochrones data is missing or not loaded.");
            }

            // School Proximity Score
            let schoolScore = 0;
            const schoolZones = geojsonFiles.find(f => f.name === 'elementary-school-zones');

            if (schoolZones && schoolZones.features) {
              schoolZones.features.forEach(zone => {
                if (turf.booleanPointInPolygon(parcel, zone)) {
                  if (zone.properties.name === 'Doyle') schoolScore = 100;
                  else if (zone.properties.name === 'Linden') schoolScore = 75;
                  else if (zone.properties.name === 'Kutz') schoolScore = 50;
                }
              });
            } else {
              console.warn("Elementary school zones data is missing or not loaded.");
            }

            // Borough Proximity Score
            let townScore = 0;
            const borough = geojsonFiles.find(f => f.name === 'borough');

            if (borough && borough.features) {
              borough.features.forEach(zone => {
                if (turf.booleanPointInPolygon(parcel, zone)) {
                  townScore = 100;
                }
              });
            } else {
              console.warn("Borough boundary data is missing or not loaded.");
            }

            // Weighted Score Calculation
            score = (townScore * weights.value.borough) + (walkingScore * weights.value.walking) + (schoolScore * weights.value.school) + (lotSizeScore * weights.value.lotSize);
            parcel.properties.Score = score;
          });

          // Update the source data with scored parcels
          map.value.getSource(file.name).setData({
            type: 'FeatureCollection',
            features: parcels,
          });

          map.value.addLayer({
            id: `${file.name}-scored`,
            type: 'fill',
            source: file.name,
            paint: {
              'fill-color': [
                'interpolate', ['linear'], ['get', 'Score'],
                0, '#FF0000',
                // 50, '#FFFF00',
                100, '#00FF00'
              ],
              'fill-opacity': 0.6
            }
          });

          map.value.on('click', `${file.name}-scored`, (e) => {
            selectedProperty.value = e.features[0].properties;

            // Zoom to the selected feature
            const bbox = turf.bbox(e.features[0]);
            map.value.fitBounds(bbox, {
              padding: 150,
            });
          });

          map.value.on('mouseenter', `${file.name}-scored`, () => {
            map.value.getCanvas().style.cursor = 'pointer';
          });
          map.value.on('mouseleave', `${file.name}-scored`, () => {
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

  return { map, selectedProperty, setMapStyle, weights, updateWeights };
}
