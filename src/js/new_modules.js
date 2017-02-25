картинки на карте
function drawOnMap() {
	imgOnMap = new google.maps.GroundOverlay('https://img.jpg', imageBounds);
	imgOnMap.setMap(map);
}



function traffic() {
	var trafficLayer = new google.maps.TrafficLayer();
	trafficLayer.setMap(map);
}


function autoPath() {
	var GDS = new google.maps.DirectionsService;
	var countedPath = new google.maps.DirectionsRenderer;
	countedPath.setMap(map);
	countedPath.setOptions({draggable: true});
	calculateAndDisplayRoute(GDS, countedPath);
}

function calculateAndDisplayRoute(GDS, countedPath) {
	var
		a = 'Moscow',
		b = 'Vologda'
		mode = 'DRIVING';
  GDS.route({
    origin: a,
    destination: b,
    travelMode: mode
    // waypoints: [{location: 'Cocklebiddy, WA'}, {location: 'Broken Hill, NSW'}]
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      countedPath.setDirections(response);
    } else {
      console.log('fail' + status);
    }
  });
}

// рисуем путь
$('[data-draw-path]').on('click', function() {
	currentPath = [];
	map.addListener('click', function(e) {
	})

});

$('[data-draw-path2]').on('click', function() {
	$('[data-input-kml]').val(JSON.stringify(currentPath))
	drawedPath.setMap(null);
});

function drawPath() {
	drawedPath = new google.maps.Polyline({
		path: currentPath,
		geodesic: true,
		strokeColor: '#2D4AD1',
		strokeOpacity: 0.7,
		strokeWeight: 3
	});

	drawedPath.setMap(map);
}



function elevation(argument) {
	https://developers.google.com/maps/documentation/javascript/examples/elevation-paths?hl=ru
}



imageBounds = {
	north: 47.273941,
	south: 47.112216,
	east: 39.72544,
	west: 39.62655
},
imgOnMap;