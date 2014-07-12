  
var map,
	markers = [],
	fb = new Firebase("https://newhavenhack.firebaseio.com/markers"),
	scope, compile, firebase, geocoder;


function MainController($scope, $compile, $firebase) {
	scope = $scope;
	compile = $compile;
	firebase = $firebase;
	geocoder = new google.maps.Geocoder();
	
	$firebase(fb).$bind(scope, "markers");

	scope.searchLocation = function () {

	    // var address = document.getElementById("address").value;
	    geocoder.geocode( { 'address': scope.search}, function(results, status) {
	      if (status == google.maps.GeocoderStatus.OK) {
			var resultBounds = new google.maps.LatLngBounds(

			    results[0].geometry.viewport.getSouthWest(), 
			    results[0].geometry.viewport.getNorthEast()
			);

			map.fitBounds(resultBounds);
	      } else {
	        alert("Geocode was not successful for the following reason: " + status);
	      }
	    });
	}
	
	scope.facebookLogin = function() {
		var auth = new FirebaseSimpleLogin(fb, function(error, user) {
			
			scope.$apply(function() {
				
			
				if(user)
					scope.facebookUser = user;	
				
				console.log(scope.facebookUser);
				
			});
			
		});

		auth.login('facebook', {
			rememberMe: true,
			scope: 'user_events'
		});
		
	}
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
		new FirebaseSimpleLogin(fb, function(error, facebookUser) {
			
			if(facebookUser)
				fb.push({lat: event.latLng.lat(), lng: event.latLng.lng(), facebookUser: facebookUser});
			else
				alert("Please click Login with Facebook before creating an event");
			
		});
		
	});

	function getRandomNeighbors(latlng) {
        // console.log(latlng);
        codeLatLng(latlng);
        for (var i=0;i<4;i++){
        	latlng.B += .0001;
	        latlng.k += .0001;
	        codeLatLng(latlng);
        }
	}

	function codeLatLng(latlng) {
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
		var pos = new google.maps.LatLng(location.lat, location.lng);

		if(markers[id]) {
			markers[id].setMap(null);
			delete markers[id];
		}


		var marker = new google.maps.Marker({
			position: pos, 
			map: map,
			icon: 'http://nwex.co.uk/images/smilies/turd.gif'
		});

		getRandomNeighbors(pos);

		google.maps.event.addListener(marker, 'click', function() {
			
			scope.$apply(function() {
				var element = compile(document.getElementById("markerEdit").innerHTML.replace(/%id%/gi, id))(scope)[0];
		
				var infowindow = new google.maps.InfoWindow({
					maxWidth: 300
				});
				infowindow.setContent(element);

				infowindow.open(map,marker);
				
				setTimeout(function() {
					
					$(element).find("input:first").focus();
					
				}, 100);
				
				
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