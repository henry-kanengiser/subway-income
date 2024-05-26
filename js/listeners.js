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
const features = map.queryRenderedFeatures({layers: 'subway-line'});

console.log(features);

// // Create buttons dynamically for each feature
// features.forEach((feature, index) => {
//     const button = document.createElement('button');
//     button.textContent = `Feature ${index + 1}`;
//     button.addEventListener('click', () => {
//         // Define your event handling logic here
//         console.log(`Feature ${index + 1} clicked`);
//         // You can replace the above console.log with your custom event handling code
//     });
//     document.body.appendChild(button); // Append button to the document body or any container
// });



// $(document).on("click", "a[name='A']", function (e) {

//     // remove clicked featurestate if it is already set on another feature
//     if (clickedsubwaylineId !== null) {
//         map.setFeatureState(
//             { source: 'nyc-subway-routes', id: clickedsubwaylineId },
//             { clicked: false }
//         )
//     }

//     // grab id var based on attribute data
//     clickedsubwaylineId = e.features[0].id;

//     // set the featureState of this feature to hover:true
//     map.setFeatureState(
//         { source: 'nyc-subway-routes', id: clickedsubwaylineId },
//         { clicked: true }
//     )

//     // Zoom to the bounds of the subway route to show all of it at once
//     const xmin = e.features[0].properties.xmin;
//     const ymin = e.features[0].properties.ymin;
//     const xmax = e.features[0].properties.xmax;
//     const ymax = e.features[0].properties.ymax;

//     map.fitBounds([[xmin, ymin], [xmax, ymax]], {
//         padding: 100 // add padding so the panels don't obstruct the view of the line
//     });

//     // Show the tracts associated with that route

//     const currentvisibility = map.getLayoutProperty(
//         'tract22-fill',
//         'visibility'
//     );

//     if (currentvisibility === 'none') {
//         map.setLayoutProperty('tract22-line', 'visibility', 'visible');
//         map.setLayoutProperty('tract22-fill', 'visibility', 'visible');
//     }
//     // Comment this out, this will toggle the visibility of the fills
//     // else {
//     //   map.setLayoutProperty('tract22-line', 'visibility', 'none');
//     //   map.setLayoutProperty('tract22-fill', 'visibility', 'none');
//     // }

//     const flagvar = e.features[0].properties.var;

//     map.setFilter('tract22-line', ['==', flagvar, 1]);
//     map.setFilter('tract22-fill', ['==', flagvar, 1]);
//     map.setFilter('tract22-fill-pop', ['==', flagvar, 1]);

//     // Set visibility for legend as well
//     $('#info-panel').show();


//     // Insert information into the #info-panel div 
//     var route = e.features[0].properties.route
//     var pop22 = numeral(e.features[0].properties.pop_tot22).format('0,0')
//     var hh22 = numeral(e.features[0].properties.num_hh22).format('0,0')
//     var mhhi22 = numeral(e.features[0].properties.mhhi22).format('0,0')
//     var pop17 = numeral(e.features[0].properties.pop_tot17).format('0,0')
//     var hh17 = numeral(e.features[0].properties.num_hh17).format('0,0')
//     var mhhi17 = numeral(e.features[0].properties.mhhi17).format('0,0')
//     var r_pop22 = numeral(e.features[0].properties.rank_pop_tot22).format('0o')
//     var r_hh22 = numeral(e.features[0].properties.rank_num_hh22).format('0o')
//     var r_mhhi22 = numeral(e.features[0].properties.rank_mhhi22).format('0o')
//     var r_pop17 = numeral(e.features[0].properties.rank_pop_tot17).format('0o')
//     var r_hh17 = numeral(e.features[0].properties.rank_num_hh17).format('0o')
//     var r_mhhi17 = numeral(e.features[0].properties.rank_mhhi17).format('0o')

//     const panelHTML = `
//     <div>
//       <h3>${route} Train </h3>
//     </div>

//     <div>
//       Residents along this route have the <b>${r_mhhi22} highest</b> household income of subway routes ($${mhhi22}). 
//       <p>
//       See the table below for more information.
//     </div>

//     <div style="border-radius: 10px; padding: 4px;">
//     <table style="border-collapse: collapse; width: 100%; font-size: smaller">
//         <tr>
//             <th style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"> </th>
//             <th style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;"> Value </th>
//             <th style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;"> Rank </th>
//         </tr>
//         <tr>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"><b>Median household income</b></td>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"></td>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"></td>
//         </tr>
//         <tr>
//             <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller;">2022 5-year estimates</td>
//             <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller; text-align: right;">$${mhhi22}</td>
//             <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller; text-align: right;">${r_mhhi22}</td>
//         </tr>
//         <tr>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;">2017 5-year estimates</td>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;">$${mhhi17}</td>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;">${r_mhhi17}</td>
//         </tr>
//         <tr>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"><b>Residents within 1/2 mile of train:</b></td>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"></td>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;"></td>
//         </tr>
//         <tr>
//             <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller;">2022 5-year estimates</td>
//             <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller; text-align: right;">${pop22}</td>
//             <td style="border-bottom: 1px solid #cccccc; padding: 2px; font-size: smaller; text-align: right;">${r_pop22}</td>
//         </tr>
//         <tr>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller;">2017 5-year estimates</td>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;">${pop17}</td>
//             <td style="border-bottom: 1px solid #292929; padding: 2px; font-size: smaller; text-align: right;">${r_pop17}</td>
//         </tr>
//     </table>
//     </div>

//     `;

//     // Update the info-panel with the table
//     document.getElementById('info-panel-text').innerHTML = panelHTML;


// });

