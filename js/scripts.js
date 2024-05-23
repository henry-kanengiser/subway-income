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
    data: 'data-analysis/dat/nyc-subway-routes.geojson',
    generateId: true // this will add an id to each feature, this is necessary if we want to use featureState (see below)
  });

  map.addLayer({
    "id": "subway-line",
    "source": "nyc-subway-routes",
    "type": "line",
    "paint": {
      'line-color': [
        'match',
        ['get', 'rt_symbol'], // Get the value of rt_symbol
        "1", "rgba(238, 53, 46, 1)",     // If rt_symbol is 1, set color to 1/2/3 red
        "4", "rgba(0, 147, 60, 1)",      // If rt_symbol is 4, set color to 4/5/6 green
        "7", "rgba(185, 51, 173, 1)",    // If rt_symbol is 7, set color to 7 purple
        "A", "rgba(0, 57, 166, 1)",      // If rt_symbol is A, set color to A/C/E blue
        "SI", "rgba(0, 57, 166, 1)",     // If rt_symbol is SI, set color to A/C/E blue
        "B", "rgba(255, 99, 25, 1)",     // If rt_symbol is B, set color to B/D/F/M orange
        "G", "rgba(108, 190, 69, 1)",    // If rt_symbol is G, set color to G green
        "L", "rgba(167, 169, 172, 1)",   // If rt_symbol is L, set color to L grey
        "N", "rgba(252, 204, 10, 1)",    // If rt_symbol is N, set color to N/Q/R/W yellow
        "J", "rgba(153, 102, 51, 1)",    // If rt_symbol is J, set color to J/Z brown,
        "S", "#808183",                  // If rt_symbol is S, set color to S grey
        "#000000"

      ],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        10,
          ['case',
          ['boolean', ['feature-state', 'clicked'], false],
          ["literal", 2],  // opacity when clicked is true
          ['boolean', ['feature-state', 'hover'], false],
          ["literal", 4],
          ["literal", 1]],
        14,
          ['case',
          ['boolean', ['feature-state', 'clicked'], false],
          ["literal", 6],  // opacity when clicked is true
          ['boolean', ['feature-state', 'hover'], false],
          ["literal", 8],
          ["literal", 4]]
      ]
    }
  })

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


  map.addLayer({
    "id": "subway_stations",
    "minzoom": 11,
    "source": "nyc-subway-stops",
    "type": "circle",
    "paint": {
      "circle-color": "rgba(255, 255, 255, 1)",
      "circle-opacity": {
        "stops": [
          [
            11.75,
            0
          ],
          [
            12,
            1
          ]
        ]
      },
      "circle-stroke-opacity": {
        "stops": [
          [
            11.75,
            0
          ],
          [
            12,
            1
          ]
        ]
      },
      "circle-radius": {
        "stops": [
          [
            10,
            2
          ],
          [
            14,
            5
          ]
        ]
      },
      "circle-stroke-width": 1,
      "circle-pitch-scale": "map"
    }
  }
  )

  // add layers by iterating over the styles in the array defined in subway-layer-styles.js
  // subwayLayerStyles.forEach((style) => {
  //   map.addLayer(style)
  // })


  // Create hover state for subway lines
  let hoveredsubwaylineId = null;

  // whenever the mouse moves on any of the subway_[color] layers, we check the id of the feature it is on 
  //  top of, and set featureState for that feature.  The featureState we set is hover:true or hover:false
  map.on('mousemove', 'subway-line', (e) => {
    // don't do anything if there are no features from this layer under the mouse pointer
    if (e.features.length > 0) {
      // if hoveredsubwaylineId already has an id in it, set the featureState for that id to hover: false
      if (hoveredsubwaylineId !== null) {
        map.setFeatureState(
          { source: 'nyc-subway-routes', id: hoveredsubwaylineId },
          { hover: false }
        );
      }

      // set hoveredsubwaylineId to the id of the feature currently being hovered
      hoveredsubwaylineId = e.features[0].id;

      // set the featureState of this feature to hover:true
      map.setFeatureState(
        { source: 'nyc-subway-routes', id: hoveredsubwaylineId },
        { hover: true }
      );

      // make the cursor a pointer to let the user know it is clickable
      map.getCanvas().style.cursor = 'pointer'

      // resets the feature state to the default (nothing is hovered) when the mouse leaves the 'borough-boundaries-fill' layer
      map.on('mouseleave', 'subway-line', () => {
        // set the featureState of the previous hovered feature to hover:false
        if (hoveredsubwaylineId !== null) {
          map.setFeatureState(
            { source: 'nyc-subway-routes', id: hoveredsubwaylineId },
            { hover: false }
          );
        }

        // clear hoveredsubwaylineId
        hoveredsubwaylineId = null;

        // set the cursor back to default
        map.getCanvas().style.cursor = ''
      });

    }
  });


})