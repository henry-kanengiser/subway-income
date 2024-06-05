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
function showline(letter) {

    // Version based on feature id
    var buttonlinefeatures = map.queryRenderedFeatures({ layers: ['subway-line'] }).filter(function (feature) {
        return feature.id === letter;
    });

    showLineData(buttonlinefeatures[0])

}



