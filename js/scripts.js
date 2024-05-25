// TO DO LIST
// - Look at list of layers using the console.log and put the block groups below the streets. Then up the opacity
// - Look at list of layers and replace waterway-label with the lowest "-label" layer
// - Create button to switch between population & household income (and adjust legend div accordingly)
// - Figure out why the table of info doesn't stretch the whole way across the div


// Turn on popovers
const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))

// Hide info-panel so it can be shown later
$('#info-panel').hide();

// set my mapboxgl access token
mapboxgl.accessToken = 'pk.eyJ1IjoiaGVucnkta2FuZW5naXNlciIsImEiOiJjbHVsdTU1Z20waG84MnFwbzQybmozMjdrIn0.tqmZ-jfP2M6xcOz09ckRPA';

// initialize the mapboxGL map in the div with id 'mapContainer'
const map = new mapboxgl.Map({
  container: 'mapContainer',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: [-73.882646, 40.082616],
  zoom: 9.3
});

// Create variables prior to map loading so they can be used in listeners
let hoveredsubwaylineId = null
let clickedsubwaylineId = null

// wait for the initial mapbox style to load before loading our own data
map.on('style.load', () => {
  // fitbounds to NYC
  map.fitBounds([
    [-74.270056, 40.494061],
    [-73.663062, 40.957187]
  ])

  // Add Census tract data (tract 17 and tract 22)
  map.addSource('tract17', {
    type: 'geojson',
    data: 'data-analysis/dat/tract17.geojson'
  });

  map.addLayer({
    'id': 'tract17-fill',
    'type': 'fill',
    'source': 'tract17', // reference the data source read in above
    'layout': {},
    'paint': {
      'fill-color': '#ccc',
      'fill-opacity': 0.2
    }
  }, 'waterway-label');

  // Add a new layer to visualize campaign zone areas (fill)
  map.addLayer({
    'id': 'tract17-line',
    'type': 'line',
    'source': 'tract17', // reference the data source read in above
    'layout': {},
    'paint': {
      'line-color': '#ccc'
    }
  }, 'waterway-label');

  // Set this layer to not be visible initially so it can be turned on using the botton
  map.setLayoutProperty('tract17-fill', 'visibility', 'none');
  map.setLayoutProperty('tract17-line', 'visibility', 'none');

  map.addSource('tract22', {
    type: 'geojson',
    data: 'data-analysis/dat/tract22.geojson'
  });

  map.addLayer({
    'id': 'tract22-fill',
    'type': 'fill',
    'source': 'tract22', // reference the data source read in above
    'layout': {},
    'paint': {
      'fill-color': [
        // // create fill colors based on site suitability scores (var: index)
        'interpolate',
        ['linear'],
        ['get', 'mhhi'],
        // colors mirror the static maps created for the report
        0,
        '#edf8fb',
        50000,
        '#b3cde3',
        100000,
        '#8c96c6',
        150000,
        '#8856a7',
        200000,
        '#810f7c'

      ],
      'fill-opacity': ["case", ["==", ["get", 'mhhi'], null], 0.3, 0.5]
    }
  }, 'waterway-label');

  // Add a new layer to visualize campaign zone areas (fill)
  map.addLayer({
    'id': 'tract22-line',
    'type': 'line',
    'source': 'tract22', // reference the data source read in above
    // 'minzoom': 11,
    'layout': {},
    'paint': {
      'line-color': '#292929',
      'line-opacity': {
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
      }
    }
  }, 'waterway-label');

  // Set this layer to not be visible initially so it can be turned on using the botton
  map.setLayoutProperty('tract22-fill', 'visibility', 'none');
  map.setLayoutProperty('tract22-line', 'visibility', 'none');


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
          ["literal", 3],  // opacity when clicked is true
          ['boolean', ['feature-state', 'hover'], false],
          ["literal", 4],
          ["literal", 1]],
        14,
        ['case',
          ['boolean', ['feature-state', 'clicked'], false],
          ["literal", 7],  // opacity when clicked is true
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



  ///////////////////////// ADD INTERACTIVE MAP STYLING HERE ////////////////////////

  // Create hover state for subway lines
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

  //// Set up click to add information to the info-panel about subway line
  // if the user clicks the 'subway-line' layer, extract properties from the clicked feature, using jQuery to write them to another part of the page.

  map.on('click', 'subway-line', (e) => {

    // remove clicked featurestate if it is already set on another feature
    if (clickedsubwaylineId !== null) {
      map.setFeatureState(
        { source: 'nyc-subway-routes', id: clickedsubwaylineId },
        { clicked: false }
      )
    }

    clickedsubwaylineId = e.features[0].id;

    // set the featureState of this feature to hover:true
    map.setFeatureState(
      { source: 'nyc-subway-routes', id: clickedsubwaylineId },
      { clicked: true }
    )

    // Zoom to the bounds of the subway route to show all of it at once
    const xmin = e.features[0].properties.xmin;
    const ymin = e.features[0].properties.ymin;
    const xmax = e.features[0].properties.xmax;
    const ymax = e.features[0].properties.ymax;

    map.fitBounds([[xmin, ymin], [xmax, ymax]], {
      padding: 100 // add padding so the panels don't obstruct the view of the line
    });

    // Show the tracts associated with that route

    const currentvisibility = map.getLayoutProperty(
      'tract22-fill',
      'visibility'
    );

    if (currentvisibility === 'none') {
      map.setLayoutProperty('tract22-line', 'visibility', 'visible');
      map.setLayoutProperty('tract22-fill', 'visibility', 'visible');
    }
    // Comment this out, this will toggle the visibility of the fills
    // else {
    //   map.setLayoutProperty('tract22-line', 'visibility', 'none');
    //   map.setLayoutProperty('tract22-fill', 'visibility', 'none');
    // }

    const flagvar = e.features[0].properties.var;

    // map.setFilter('tract22-line', ['==', flagvar, 1]);
    map.setFilter('tract22-fill', ['==', flagvar, 1]);

    // Set visibility for legend as well
    $('#info-panel').show();


    // Insert information into the #info-panel div 
    var route = e.features[0].properties.route
    var pop22 = numeral(e.features[0].properties.pop_tot22).format('0,0')
    var hh22 = numeral(e.features[0].properties.num_hh22).format('0,0')
    var mhhi22 = numeral(e.features[0].properties.mhhi22).format('0,0')
    var pop17 = numeral(e.features[0].properties.pop_tot17).format('0,0')
    var hh17 = numeral(e.features[0].properties.num_hh17).format('0,0')
    var mhhi17 = numeral(e.features[0].properties.mhhi17).format('0,0')
    var r_pop22 = numeral(e.features[0].properties.rank_pop_tot22).format('0o')
    var r_hh22 = numeral(e.features[0].properties.rank_num_hh22).format('0o')
    var r_mhhi22 = numeral(e.features[0].properties.rank_mhhi22).format('0o')
    var r_pop17 = numeral(e.features[0].properties.rank_pop_tot17).format('0o')
    var r_hh17 = numeral(e.features[0].properties.rank_num_hh17).format('0o')
    var r_mhhi17 = numeral(e.features[0].properties.rank_mhhi17).format('0o')

    const panelHTML = `
    <div>
      <h3>${route} Train </h3>
    </div>

    <div>
      Residents along this route have the <b>${r_mhhi22} highest</b> household income of subway routes ($${mhhi22}). 
      <p>
      See the table below for more information.
    </div>

    <div style="border-radius: 10px; padding: 4px;">
    <table style="border-collapse: collapse; width: 10% font-size: smaller">
        <tr>
            <th style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"> </th>
            <th style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;"> Value </th>
            <th style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;"> Rank </th>
        </tr>
        <tr>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"><b>Median household income</b></td>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"></td>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"></td>
        </tr>
        <tr>
            <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller;">2022 5-year estimates</td>
            <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller; text-align: right;">$${mhhi22}</td>
            <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller; text-align: right;">${r_mhhi22}</td>
        </tr>
        <tr>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;">2017 5-year estimates</td>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;">$${mhhi17}</td>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;">${r_mhhi17}</td>
        </tr>
        <tr>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"><b>Residents within 1/2 mile of train:</b></td>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"></td>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"></td>
        </tr>
        <tr>
            <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller;">2022 5-year estimates</td>
            <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller; text-align: right;">${pop22}</td>
            <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller; text-align: right;">${r_pop22}</td>
        </tr>
        <tr>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;">2017 5-year estimates</td>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;">${pop17}</td>
            <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;">${r_pop17}</td>
        </tr>
    </table>
</div>

    `;

    // Update the info-panel with the table
    document.getElementById('info-panel-text').innerHTML = panelHTML;

  });

  // DOESN'T WORK WELL WITH MULTIPLE ROUTES AT ONCE, SO CREATE A BUTTON THAT CAN CLEAR THE CLICKED FEATURE
  // de-select the route by clicking elsewhere on the map
  map.on('click', function (e) {
    var features = map.queryRenderedFeatures(e.point);

    if (!features.length) {
      // User clicked on a blank part of the map
      // Set the feature state of previously clicked features to `clicked: false`
      // Replace 'your-layer-id' with the ID of your layer
      map.setFeatureState(
        { source: 'nyc-subway-routes', id: clickedsubwaylineId },
        { clicked: false }

      );

    }

  });
});

// Script to hide info-panel and reset the train route selection
function closeinfo() {
  $('#info-panel').hide();

  // set the featureState of this feature to clicked:false
  map.setFeatureState(
    { source: 'nyc-subway-routes', id: clickedsubwaylineId },
    { clicked: false }
  )
  // hide tract line and fill information
  map.setLayoutProperty('tract22-line', 'visibility', 'none');
  map.setLayoutProperty('tract22-fill', 'visibility', 'none');

}

