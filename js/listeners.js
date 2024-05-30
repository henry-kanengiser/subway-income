// This script contains all the jQuery listeners used on this website

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
    map.setLayoutProperty('tract22-fill-pop', 'visibility', 'none');

    // hide subway station darker layer
    map.setLayoutProperty('subway-stations-darker', 'visibility', 'none');


}

// Script to toggle the mhhi information via the button
$('#mhhi-button').on('click', function () {

    // set the button to active state & toggle the other button 
    $(this).toggleClass("active");
    $('#pop-button').toggleClass("active");

    // make the mhhi layer visible and the population layer not visible
    map.setLayoutProperty('tract22-fill', 'visibility', 'visible');
    map.setLayoutProperty('tract22-fill-pop', 'visibility', 'none');

})

// Script to toggle the pop information via the button
$('#pop-button').on('click', function () {

    // set the button to active state
    $(this).toggleClass("active");
    $('#mhhi-button').toggleClass("active");

    // make the mhhi layer visible and the population layer not visible
    map.setLayoutProperty('tract22-fill-pop', 'visibility', 'visible');
    map.setLayoutProperty('tract22-fill', 'visibility', 'none');

})

// Script to trigger subway line information from the dropdown menu

// Retrieve features from the map layer

// map.once('render', function () {
//     var features = map.queryRenderedFeatures({ layers: ['subway-line'] });

//     console.log(features);
//     // map.fire('click', {
//     //     lngLat: /* set the coordinates of the feature */,
//     //     point: /* set the point of the feature */,
//     //     features: [features[0]],
//     //     source: source.id,
//     //     target: featureId
//     // });
// });



