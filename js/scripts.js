// TO DO LIST
// - Create hover state for subway lines where the width becomes much larger
// - Create click event when clicking on a subway line. The following happens:
//    The map zoomes to include the entire subway line (which remains larger width)
//    New information pops up showing the total population & median HH income of line residents (& rank among subway lines)
// - Create click event when clicking on a subway stop. The following happens:
//    Stop changes color (becomes grey)
//    Zoom in and center the stop
//    



// set my mapboxgl access token
mapboxgl.accessToken = 'pk.eyJ1IjoiaGVucnkta2FuZW5naXNlciIsImEiOiJjbHVsdTU1Z20waG84MnFwbzQybmozMjdrIn0.tqmZ-jfP2M6xcOz09ckRPA';

// initialize the mapboxGL map in the div with id 'mapContainer'
const map = new mapboxgl.Map({
  container: 'mapContainer',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-73.882646, 40.082616],
  zoom: 9.3
});

// wait for the initial mapbox style to load before loading our own data
map.on('style.load', () => {
  // fitbounds to NYC
  map.fitBounds([
    [-74.270056, 40.494061],
    [-73.663062, 40.957187]
  ])

  // Add Census block group data (bg 17 and bg 22)
  map.addSource('bg17', {
    type: 'geojson',
    data: 'data-analysis/dat/bg17.geojson'
  });

  map.addLayer({
    'id': 'bg17-fill',
    'type': 'fill',
    'source': 'bg17', // reference the data source read in above
    'layout': {},
    'paint': {
      'fill-color': '#ccc',
      'fill-opacity': 0.2
    }
  }, 'waterway-label');

  // Add a new layer to visualize campaign zone areas (fill)
  map.addLayer({
    'id': 'bg17-line',
    'type': 'line',
    'source': 'bg17', // reference the data source read in above
    'layout': {},
    'paint': {
      'line-color': '#ccc'
    }
  }, 'waterway-label');

  // Set this layer to not be visible initially so it can be turned on using the botton
  map.setLayoutProperty('bg17-fill', 'visibility', 'none');
  map.setLayoutProperty('bg17-line', 'visibility', 'none');

  map.addSource('bg22', {
    type: 'geojson',
    data: 'data-analysis/dat/bg22.geojson'
  });

  map.addLayer({
    'id': 'bg22-fill',
    'type': 'fill',
    'source': 'bg22', // reference the data source read in above
    'layout': {},
    'paint': {
      'fill-color': '#ccc',
      'fill-opacity': 0.2
    }
  }, 'waterway-label');

  // Add a new layer to visualize campaign zone areas (fill)
  map.addLayer({
    'id': 'bg22-line',
    'type': 'line',
    'source': 'bg22', // reference the data source read in above
    'layout': {},
    'paint': {
      'line-color': '#ccc'
    }
  }, 'waterway-label');

  // Set this layer to not be visible initially so it can be turned on using the botton
  map.setLayoutProperty('bg22-fill', 'visibility', 'none');
  map.setLayoutProperty('bg22-line', 'visibility', 'none');


  // add geojson sources for subway routes and stops
  //  pulled from Chris Whong's subway template (https://github.com/chriswhong/mapboxgl-nyc-subway)
  map.addSource('nyc-subway-routes', {
    type: 'geojson',
    data: 'data-analysis/dat/nyc-subway-routes.geojson'
  });

  // Don't use the subway stops from Chris Whong's GitHub example, instead use the version I created 
  // map.addSource('nyc-subway-stops', {
  //   type: 'geojson',
  //   data: 'data-analysis/dat/nyc-subway-stops.geojson'
  // });

  // add subway stations information (using Chris's source ID but my data)
  map.addSource('nyc-subway-stops', {
    type: 'geojson',
    data: 'data-analysis/dat/station_summary.geojson',
    generateId: true
  });

  // add layers by iterating over the styles in the array defined in subway-layer-styles.js
  subwayLayerStyles.forEach((style) => {
    map.addLayer(style)
  })


})