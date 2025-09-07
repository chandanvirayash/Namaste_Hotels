

// MapLibre with an alternative clean style
(function(){
  if (typeof maplibregl === 'undefined') {
    console.error('MapLibre GL JS not loaded');
    return;
  }
  if (!listing || !listing.geometry || !Array.isArray(listing.geometry.coordinates)) {
    console.warn('Listing coordinates missing');
    return;
  }

  const coords = listing.geometry.coordinates;

  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: coords,
    zoom: 9
  });

  new maplibregl.Marker({ color: 'red' })
    .setLngLat(coords)
    .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
      `<h4>${listing.location}</h4><p>Exact Location Provided after booking</p>`
    ))
    .addTo(map);
})();