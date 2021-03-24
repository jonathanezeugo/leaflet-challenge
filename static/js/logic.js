// Query the USGS geoJSON website and perform an API call to earthquates information. 
let queryUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'; // for all week
//let queryUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson'; // for all month

// Load in GeoJSON data
let geojsonPlates = "GeoJSON/PB2002_plates.json";
// let geojsonBoundaries = "GeoJSON/PB2002_boundaries.json";
// let geojsonOrogens = "GeoJSON/PB2002_orogens.json";
// let geojsonSteps = "GeoJSON/PB2002_steps.json";


// Performing a GET request to the query URL and doing a quick view of both dataset at the console
d3.json(queryUrl, function(usgsdata) {
    console.log(usgsdata);
    d3.json(geojsonPlates, function(tecPlatesData){
        // Once we get a response, send the data.features object to the createFeatures function
        console.log(tecPlatesData);
        createFeatures(usgsdata.features, tecPlatesData.features);
    })
});

// Perform a GET request to the query URL (NOT SURE WHY IT SAYS .then(...) is not a function)
// d3.json(queryUrl).then(usgsdata => {
//     console.log(usgsdata)
//     // Once we get a response, send the data.features object to the createFeatures function
//     ;d3.json(geojsonPlates).then(tecPlatesData => {
//         console.log(tecPlatesData)
//         ;createFeatures(usgsdata.features, tecPlatesData.features);
//     })
// });

// Creating the createFeatures function to set up features for the map
function createFeatures(earthquakeData, tectonicPlatesData) {

    // Define a function we want to run once for each feature in the features array
    // Give each feature a popup describing the place,time, magnitude, and type of the earthquake
    function onEachFeature(feature, layer) {
        layer.bindPopup(`<h3><b>Place: ${feature.properties.place}<br>
          <p>Time: ${new Date(feature.properties.time)}</p>
          <p>Magnitude: ${feature.properties.mag}</p>
          Type: ${feature.properties.type}</b></h3>`);
      }
  
    // Create a GeoJSON layer containing the features array on the earthquakeData object
    // Run the onEachFeature function once for each piece of data in the array
    let earthquakes = L.geoJSON(earthquakeData, {
      onEachFeature: onEachFeature,
        // Creating the circle function for each location taking in feature and coordinates data
      pointToLayer: function (feature, latlng) {
        return L.circle(latlng, {
        stroke: true,
        fillOpacity: 0.5,
        color: "black",
        fillColor: getColor(feature.properties.mag),
        radius: feature.properties.mag*25000 // magnitude multiplication for better visibility
        });
      }
    
    });
    // creating the tectonicPlates layer
    let tectonicPlates = L.geoJSON(tectonicPlatesData, {
        pointToLayer: function (feature, latlng) {
              return L.marker(latlng);
      }
    });
  
    // Sending our earthquakes and tectonicPlates layers to the createMap function
    createMap(earthquakes, tectonicPlates);
}
// Function for creating map tile layers
function createMap(earthquakes, tectonicPlates) {
    
    // Creating the streetMap tile layer
    let streetMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: API_KEY
    });//.addTo(myMap);

    // Creating the satelliteMap tile layer
    let satelliteMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/satellite-v9',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: API_KEY
    });//.addTo(myMap);

    // Creating the outdoorMap tile layer
    let outdoorMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/outdoors-v9',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: API_KEY
    });//.addTo(myMap);

    // Create a baseMaps object to hold the streetMap, satelliteMap and outdoorMap layers
    let baseMaps = {
        'Satellite Map': satelliteMap,
        'Street Map': streetMap,
        'Outdoors': outdoorMap
    }

    // Create overlay object to hold our overlay layer
    let overlayMaps = {
        'Earthquakes': earthquakes,
        'Tectonic Plates': tectonicPlates
    };

    // Create the map object with options
    let myMap = L.map("map-id", {
        center: [36.52383333, -98.97783333],
        zoom: 4,
        layers: [tectonicPlates, streetMap, earthquakes]
    });

    // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control and legend to the map
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(myMap);
    
    // adding legend to the map
    legend.addTo(myMap);
}

// Creating the getcolor function for the colors of legend and locations in map
function getColor(d){
    return d > 20 ? '#a31010' ://Red
           d > 10  ? '#fc8105'://orange
           d > 4  ? '#221cd6'://blue
           d > 2  ? '#fc05d7'://pink
           d > 1   ? '#f8fc05'://yellow
           d > 0   ? '#6fc75a' ://Green
                     '#23702e';//Dark Green
}

// Creating the legend
let legend = L.control({position: 'bottomright'});

legend.onAdd = function () {

    let div = L.DomUtil.create('div', 'info legend'),
        // grades = [0, 1, 2, 3, 4, 5],
        // grades = [0, 1, 2, 5, 10, 20],
        grades = [0, 1, 2, 4, 10, 20],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i class="circle" style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;    
};