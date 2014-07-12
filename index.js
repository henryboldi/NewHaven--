  
var map,
	markers = [],
	fb = new Firebase("https://newhavenhack.firebaseio.com/markers"),
	scope, compile, firebase;

function MainController($scope, $compile, $firebase) {
	console.log(arguments);
	scope = $scope;
	compile = $compile;
	firebase = $firebase;
}


function initialize() {
	
	var myLatLng = new google.maps.LatLng(41.3127341,-72.92376569999999);


	fb.on("child_added", function(snapshot) {
		placeMarker(snapshot.name(), snapshot.val());
	});

	fb.on("child_changed", function(snapshot) {
		placeMarker(snapshot.name(), snapshot.val());
	});

	fb.on("child_removed", function(snapshot) {
		var id = snapshot.name();
		if(markers[id]) markers[id].setMap(null);
	});

	var mapOptions = {
		center: myLatLng,
		zoom: 15
	};
	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

	var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
	var icons = {
		parking: {
			icon: iconBase + 'parking_lot_maps.png'
		},
		library: {
			icon: iconBase + 'library_maps.png'
		},
		info: {
			icon: iconBase + 'info-i_maps.png'
		}
	};

	google.maps.event.addListener(map, 'click', function(event) {
	fb.push({lat: event.latLng.lat(), lng: event.latLng.lng()});
	});

	window.updateMarker = function(id) {

		fb.child(id).update({
			title: document.querySelector("[uid="+id+"] [name=title]").value,
			description: document.querySelector("[uid="+id+"] [name=description]").value,
			time: document.querySelector("[uid="+id+"] [name=time]").value
		});
	};

	function getRandomNeighbors(latlng) {
        
        codeLatLng(latlng);
	}

	function codeLatLng(latlng) {
	// var input = document.getElementById("latlng").value;
	// var latlngStr = input.split(",",2);
	// var lat = parseFloat(latlngStr[0]);
	// var lng = parseFloat(latlngStr[1]);
	// var latlng = new google.maps.LatLng(lat, lng);

		geocoder.geocode({'latLng': latlng}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				console.log(results[0].formatted_address);
				// if (results[1]) {
				//   map.setZoom(11);
				//   marker = new google.maps.Marker({
				//       position: latlng,
				//       map: map
				//   });
				//   infowindow.setContent(results[1].formatted_address);
				//   infowindow.open(map, marker);
				// }
			} else {
				console.log("Geocoder failed due to: " + status);
			}
		});
	}


	function placeMarker(id, location) {

		if(markers[id]) {
			markers[id].setMap(null);
			delete markers[id];
		}


		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(location.lat, location.lng), 
			map: map,
			icon: 'http://nwex.co.uk/images/smilies/turd.gif'
		});


		google.maps.event.addListener(marker, 'click', function() {
			
			scope.$apply(function() {
				
				firebase(fb.child(id)).$bind(scope, "user");

				var element = compile(document.getElementById("markerEdit").innerHTML)(scope)[0];

				console.log(document.getElementById("markerEdit").innerHTML, element[0]);
				
				var infowindow = new google.maps.InfoWindow();
				infowindow.setContent(element);

				infowindow.open(map,marker);
				
			});
			
		});
	}

	//handleNoGeolocation();
	
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			var pos = new google.maps.LatLng(position.coords.latitude,
			                         position.coords.longitude);

			// var infowindow = new google.maps.InfoWindow({
			// 	map: map,
			// 	position: pos,
			// 	content: 'Location found using HTML5.'
			// });

			map.setCenter(pos);
		});
	}
	
	angular.module("map", ['firebase'])
	
	angular.bootstrap(document, ['map']);

}

google.maps.event.addDomListener(window, 'load', initialize);