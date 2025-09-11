

// MapLibre with an alternative clean style
(function(){
  if (typeof maplibregl === 'undefined') {
    console.error('MapLibre GL JS not loaded');
    return;
  }
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.warn('Map container not found');
    return;
  }

  function initMap(coords){
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: coords,
      zoom: 9
    });

    new maplibregl.Marker({ color: 'red' })
      .setLngLat(coords)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
        `<h4>${listing?.location || 'Listing'}</h4><p>Exact location provided after booking</p>`
      ))
      .addTo(map);
  }

  // Prefer server-provided geometry
  if (listing && listing.geometry && Array.isArray(listing.geometry.coordinates) && listing.geometry.coordinates.length === 2) {
    initMap(listing.geometry.coordinates);
    return;
  }

  // Fallback: client-side geocode using Nominatim if we at least have a location string
  const locationStr = listing && listing.location ? String(listing.location) : '';
  if (!locationStr) {
    console.warn('Listing location missing');
    return;
  }

  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(locationStr);
  fetch(url, { headers: { 'Accept': 'application/json' } })
    .then(function(res){ return res.json(); })
    .then(function(data){
      if (Array.isArray(data) && data.length > 0 && data[0].lon && data[0].lat) {
        const coords = [Number(data[0].lon), Number(data[0].lat)];
        initMap(coords);
      } else {
        console.warn('No geocoding result for location');
      }
    })
    .catch(function(err){
      console.error('Client-side geocoding failed', err);
    });
})();