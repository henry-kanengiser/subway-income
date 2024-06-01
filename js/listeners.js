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

// Script to trigger subway line information from the dropdown menu (doing it for A train before iterating it)
// Getting closer, but it always clicks on the first feature of the layer (SI), 
//  not sure why and not sure how to fix this
function showline() {
    // Only run this function once the map is fully loaded (not needed in this iteration)
    // map.on('render', afterChangeComplete); // warning: this fires many times per second!

    // function afterChangeComplete() {
    if (!map.loaded()) {
        console.log('map not loaded yet');
        return
    } // still not loaded; bail out.

    // now that the map is loaded, it's safe to query the features:

    var source = map.getSource('nyc-subway-routes');

    // // Query all features from the line
    // var buttonline = map.queryRenderedFeatures({ layers: ['subway-line'] });

    // Version based on feature id
    var buttonline = map.queryRenderedFeatures({ layers: ['subway-line'] }).filter(function (feature) {
        return feature.id === 'A';
    });
    // // Version based on route attribute
    // var buttonline = map.queryRenderedFeatures({ layers: ['subway-line'] }).filter(function(feature) {
    //   return feature.properties.route === 'SI';
    // });

    // log which line is being queried to the console
    console.log('var buttonline:');
    console.log(buttonline[0]);


    // simulate a click on this feature (I think something is missing here)
    map.fire('click', 'subway-line', {
        source: buttonline[0],
        target: "A"
    });

    // map.off('render', afterChangeComplete); // remove this handler now that we're done.
    // }
}



