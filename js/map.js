/**
 * YATRA - Leaflet Map Integration Module
 * Handles interactive map rendering, custom markers, route polylines, and tile layers
 */

const YatraMap = (function() {
  let exploreMap = null;
  let itineraryMap = null;
  let markersLayer = null;
  let itineraryLayer = null;
  let currentMarkers = {};
  let currentPolyline = null;
  let activeTileLayer = 'streets';

  // Tile Layer Providers
  const TILE_LAYERS = {
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    },
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      options: {
        maxZoom: 19,
        attribution: '&copy; CARTO'
      }
    }
  };

  /**
   * Initialize or update Explore Map
   */
  function initExploreMap(cityId = 'patna') {
    const city = YATRA_CITIES[cityId] || YATRA_CITIES.patna;
    const container = document.getElementById('map-canvas');
    if (!container) return;

    if (!exploreMap) {
      exploreMap = L.map('map-canvas', {
        zoomControl: false,
        attributionControl: false
      }).setView(city.coordinates, city.zoom);

      // Add custom zoom controls to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(exploreMap);

      // Default tile layer
      setTileLayer(activeTileLayer, exploreMap);

      markersLayer = L.layerGroup().addTo(exploreMap);
    } else {
      exploreMap.setView(city.coordinates, city.zoom);
    }

    renderExploreMarkers(cityId);
    setTimeout(() => {
      exploreMap.invalidateSize();
    }, 200);
  }

  /**
   * Set Tile Layer (streets, satellite, light)
   */
  function setTileLayer(layerKey, mapInstance) {
    if (!mapInstance) mapInstance = exploreMap;
    if (!mapInstance || !TILE_LAYERS[layerKey]) return;

    activeTileLayer = layerKey;
    mapInstance.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        mapInstance.removeLayer(layer);
      }
    });

    const cfg = TILE_LAYERS[layerKey];
    L.tileLayer(cfg.url, cfg.options).addTo(mapInstance);
  }

  /**
   * Render category-filtered place markers on Explore Map
   */
  function renderExploreMarkers(cityId, category = 'all', maxRadiusKm = 20) {
    if (!exploreMap || !markersLayer) return;

    markersLayer.clearLayers();
    currentMarkers = {};

    const city = YATRA_CITIES[cityId] || YATRA_CITIES.patna;
    const places = YATRA_PLACES.filter(p => p.cityId === cityId && (category === 'all' || p.category === category));

    const bounds = L.latLngBounds();

    places.forEach((place, index) => {
      const latlng = [place.lat, place.lng];
      bounds.extend(latlng);

      // Choose Material Symbol icon according to category
      let iconName = 'place';
      if (place.category === 'history') iconName = 'account_balance';
      if (place.category === 'nature') iconName = 'park';
      if (place.category === 'culture') iconName = 'temple_hindu';
      if (place.category === 'food') iconName = 'restaurant';
      if (place.category === 'adventure') iconName = 'hiking';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div class="yatra-marker" id="marker-${place.id}">
            <span class="material-symbols-outlined marker-icon text-primary text-[20px]">${iconName}</span>
            <span class="marker-badge">#${index + 1}</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20]
      });

      const popupHtml = `
        <div class="w-64 bg-white dark:bg-slate-900 rounded-lg overflow-hidden text-slate-800 dark:text-slate-100 shadow-md">
          <div class="relative h-28 w-full overflow-hidden">
            <img src="${place.image}" alt="${place.name}" class="w-full h-full object-cover">
            <span class="absolute top-2 left-2 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
              ★ ${place.rating} (${place.reviewsCount})
            </span>
          </div>
          <div class="p-3">
            <span class="text-[11px] font-semibold text-primary uppercase tracking-wider">${place.badge}</span>
            <h4 class="font-bold text-sm text-slate-900 dark:text-white leading-tight mt-0.5">${place.name}</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${place.description}</p>
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ${place.entryFee === 0 ? 'Free Entry' : '₹' + place.entryFee + ' / ticket'}
              </span>
              <button onclick="YatraApp.openPlaceModal('${place.id}')" class="px-2.5 py-1 text-xs bg-primary text-white rounded font-medium hover:bg-primary-hover transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker(latlng, { icon: customIcon })
        .bindPopup(popupHtml)
        .addTo(markersLayer);

      marker.on('click', () => {
        highlightMarker(place.id);
        if (typeof YatraApp !== 'undefined' && YatraApp.highlightPlaceCard) {
          YatraApp.highlightPlaceCard(place.id);
        }
      });

      currentMarkers[place.id] = marker;
    });

    if (places.length > 0) {
      exploreMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }

  /**
   * Highlight marker when clicked or when corresponding list card is hovered
   */
  function highlightMarker(placeId) {
    document.querySelectorAll('.yatra-marker').forEach(el => el.classList.remove('active'));
    const markerEl = document.getElementById(`marker-${placeId}`);
    if (markerEl) {
      markerEl.classList.add('active');
    }
    const marker = currentMarkers[placeId];
    if (marker && exploreMap) {
      exploreMap.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
      marker.openPopup();
    }
  }

  /**
   * Render Route on Itinerary Map
   */
  function renderItineraryMap(stops) {
    const container = document.getElementById('itinerary-map');
    if (!container) return;

    if (!itineraryMap) {
      itineraryMap = L.map('itinerary-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([25.5941, 85.1376], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(itineraryMap);
      setTileLayer('light', itineraryMap);
      itineraryLayer = L.layerGroup().addTo(itineraryMap);
    } else {
      itineraryLayer.clearLayers();
    }

    if (currentPolyline) {
      itineraryMap.removeLayer(currentPolyline);
      currentPolyline = null;
    }

    const latLngs = [];
    const bounds = L.latLngBounds();

    stops.forEach((stop, idx) => {
      const place = typeof stop.placeId === 'string' 
        ? YATRA_PLACES.find(p => p.id === stop.placeId) 
        : stop;

      if (!place) return;

      const latlng = [place.lat, place.lng];
      latLngs.push(latlng);
      bounds.extend(latlng);

      const numberedIcon = L.divIcon({
        className: 'custom-itinerary-pin',
        html: `
          <div class="yatra-marker numbered" style="background: #003fb1; color: white;">
            <div class="pulse-ring"></div>
            <span>${idx + 1}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker(latlng, { icon: numberedIcon })
        .bindPopup(`
          <div class="p-2 min-w-[180px]">
            <span class="text-[10px] font-bold text-primary uppercase">Stop #${idx + 1}</span>
            <h5 class="font-bold text-sm">${place.name}</h5>
            <p class="text-xs text-slate-500 mt-0.5">${stop.arrival || 'Scheduled'} (${stop.dwell || place.dwellTimeMin + 'm'})</p>
          </div>
        `)
        .addTo(itineraryLayer);
    });

    // Draw route polyline with glowing multi-layer lines
    if (latLngs.length > 1) {
      // Glow under-line
      L.polyline(latLngs, {
        color: '#1a56db',
        weight: 8,
        opacity: 0.25,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(itineraryLayer);

      // Main route polyline
      currentPolyline = L.polyline(latLngs, {
        color: '#003fb1',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(itineraryLayer);

      itineraryMap.fitBounds(bounds, { padding: [50, 50] });
    }

    setTimeout(() => {
      itineraryMap.invalidateSize();
    }, 200);
  }

  return {
    initExploreMap,
    renderExploreMarkers,
    highlightMarker,
    setTileLayer,
    renderItineraryMap
  };
})();
