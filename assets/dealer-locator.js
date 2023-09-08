class DealerLocator extends HTMLElement {
    constructor() {
			super();

			this.url = this.dataset.url
			this.pin = this.dataset.pin
			this.mapContainer = this.querySelector('#wpsl-gmap');
			this.map = {}
			this.markersArray = [];
			this.openInfoWindow = [];
			this.storeList = this.querySelector('#wpsl-stores ul')
			this.searchInput = this.querySelector('#wpsl-search-input')
			this.storeData = '';
			this.geocoder = null
			this.searchInput.addEventListener('keypress', this.keyboardAutoCompleteSubmit.bind(this));
			this.visibleMarkers = []
			this.radiusMile = 50;

			this.activateAutocomplete();
			
			const call = (async () => {
				let data = await this.fetchData(this.url);
				this.initMap(data);
			})();
    }

		keyboardAutoCompleteSubmit(e) {
			if ( e.which == 13 ) {
				this.resetSearchResults();
				this.codeAddress( this.infoWindow );
	
				return false;
			}
		}

		resetSearchResults() {
			this.storeList.innerHTML = ''
		}

		activateAutocomplete() {
			var autocomplete, place, autoCompleteLatLng,
				options = {};
		
			let searchInput = this.searchInput
			let _this = this

			options = {
				fields: ['geometry.location'],
				types: ['(regions)']
			}
		
			autocomplete = new google.maps.places.Autocomplete( searchInput, options );
			
			autocomplete.addListener( "place_changed", function() {
				place = autocomplete.getPlace();

				if ( place.geometry ) {
					autoCompleteLatLng = place.geometry.location;
					_this.prepareStoreSearch( autoCompleteLatLng);
				}
			});
		}
		
		async fetchData(url) {
			const response = await fetch(url);
  		const jsonData = await response.json();
  		
			return jsonData;
		}

		initMap(markers = []) {
			
			let center = new google.maps.LatLng(45.521, -122.677);
			const mapOptions = {
				zoom: 10,
				center: center,
				mapTypeId: google.maps.MapTypeId[ 'terrain' ],
				mapTypeControl: true,
				streetViewControl: true,
				styles: [{"elementType":"geometry","stylers":[{"color":"#cbd3b9"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#523735"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#f5f1e6"}]},{"featureType":"administrative","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#c9b2a6"}]},{"featureType":"administrative.country","stylers":[{"visibility":"on"}]},{"featureType":"administrative.land_parcel","elementType":"geometry.stroke","stylers":[{"color":"#c9d2b6"}]},{"featureType":"administrative.land_parcel","elementType":"labels.text.fill","stylers":[{"color":"#ae9e90"}]},{"featureType":"administrative.locality","stylers":[{"visibility":"on"},{"weight":1.5}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#000000"}]},{"featureType":"administrative.neighborhood","stylers":[{"visibility":"off"}]},{"featureType":"administrative.province","stylers":[{"visibility":"on"}]},{"featureType":"administrative.province","elementType":"labels.text.stroke","stylers":[{"weight":1.5}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":"#c9d2b7"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#e1e0c3"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#93817c"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#e1e0c1"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#447530"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#fdfcf8"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#fdfcf8"}]},{"featureType":"road.arterial","elementType":"labels","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#afaa91"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#afaa91"}]},{"featureType":"road.highway","elementType":"labels","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry","stylers":[{"color":"#afaa91"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry.stroke","stylers":[{"color":"#afaa91"}]},{"featureType":"road.highway.controlled_access","elementType":"labels","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway.controlled_access","elementType":"labels.icon","stylers":[{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"labels","stylers":[{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":"#806b63"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"color":"#afaa91"}]},{"featureType":"transit.line","elementType":"labels.text.fill","stylers":[{"color":"#8f7d77"}]},{"featureType":"transit.line","elementType":"labels.text.stroke","stylers":[{"color":"#ebe3cd"}]},{"featureType":"transit.station","elementType":"geometry","stylers":[{"color":"#afaa91"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#a5c3cb"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#92998d"}]}],
				zoomControlOptions: {
					position: google.maps.ControlPosition.TOP_LEFT
				},
				scrollwheel: true,
			}

			this.geocoder = new google.maps.Geocoder();
			this.map 			= new google.maps.Map( this.mapContainer, mapOptions );

			let bounds	= new google.maps.LatLngBounds();
			
			if(markers.length) {
				let infoWindow = this.newInfoWindow();

				for (let index = 0; index < markers.length; index++) {
					const element = markers[index];
					const latLng = new google.maps.LatLng( element.lat, element.lng );

					this.addMarker( this, latLng, element, infoWindow);
					
					bounds.extend( latLng );
				}

				this.showVisibleMarkers()
			} else {
				this.storeList.innerHTML = "<li class='wpsl-no-results-msg'>No results found</li>";
			}

			this.prepareListItems(this.markersArray)

			if ( markers.length > 1 ) {
				// Make all the markers fit on the map.
				this.map.fitBounds( bounds );
			}
		}

		addMarker( _this, latLng, element, infoWindow ) {
			if(element.status != 'publish') return;

			let mapIcon = {
				url: this.pin,
				scaledSize: new google.maps.Size( Number( 24 ), Number( 35 ) ), //retina format
			};

			
			let marker = new google.maps.Marker({
				position: latLng,
				map: this.map,
				optimized: false,
				title: element.name,
				draggable: false,
				icon: mapIcon,
				element
			});	

			this.markersArray.push(marker);

			const infoWindowContent = `
				<div data-store-id="${element.wpsl_id}" class="wpsl-info-window">
					<p>
						<strong><a href="${element.url}" tabindex="0">${element.name}</a></strong>
						<span>${element.address}</span>
						<span>${element.city} ${element.state} ${element.zip}</span>
					</p>
					<span><strong>Phone</strong>: <a href="tel:${element.phone.replace('(', '').replace(')', '').replace(' ', '').replace('-', '')}">${element.phone}</a></span>
					<div class="wpsl-info-actions"><a class="wpsl-directions" href="#">Directions</a></div>
				</div>
			`;

			google.maps.event.addListener( marker, "click",( function( currentMap ) {
				return function() {
					_this.setInfoWindowContent(_this,  marker, infoWindowContent, infoWindow, currentMap );
				};
			}( this.map ) ) );
		}
		
		showVisibleMarkers(latlng) {
			let distance_lat,distance_lng;
			const bounds = this.map.getBounds();
			const newBounds	= new google.maps.LatLngBounds();
			const markers = this.markersArray;

			const map_center = this.map.getCenter();
	
			if(latlng) {
				distance_lat = latlng.lat();
				distance_lng = latlng.lng();
			} else {
				distance_lat = map_center.lat();
				distance_lng = map_center.lng();
			}
	
			let radius = (this.radiusMile * 1.609344) * 1000;

			if(latlng) {
				this.visibleMarkers = [...markers].filter(marker => {
					marker.setMap(null)

					let distance = google.maps.geometry.spherical.computeDistanceBetween(latlng, marker.getPosition())
					marker.distance = distance;
					marker.element.distanceToMile = (distance * 0.000621371).toFixed(2);

					if(marker.distance <= radius) {
						marker.setMap(this.map)
						newBounds.extend(marker.getPosition());
					} else {
						marker.setMap(null)
					}
					
					return marker.distance <= radius;
				}).sort((a, b) => {
					return a.distance - b.distance;
				})

				if(this.visibleMarkers.length >= 1) {
					this.map.fitBounds(newBounds);
				} else {
					this.map.setZoom(8)
				}
			} else {
				this.visibleMarkers = markers

				this.visibleMarkers.map(marker => {
					newBounds.extend(marker.getPosition());
					marker.setMap(this.map)
				})
				this.map.fitBounds(newBounds);
			}

			if(this.visibleMarkers.length == 1) {
				this.map.setZoom(8)
			}
			
			this.prepareListItems(this.visibleMarkers)
		}

		setInfoWindowContent(_this, marker, infoWindowContent, infoWindow, currentMap) {
			infoWindow.setContent( infoWindowContent );
			infoWindow.open( currentMap, marker );
			
			_this.openInfoWindow.push( infoWindow );
		}

		newInfoWindow() {
			let infoWindow = new google.maps.InfoWindow();

			return infoWindow;
		}

		codeAddress( infoWindow ) {
			let latLng, request = {};
			let _this = this

			request.address = this.searchInput.value;

			this.geocoder.geocode( request, function( response, status ) {
				if ( status == google.maps.GeocoderStatus.OK ) {
					latLng = response[0].geometry.location;
					_this.prepareStoreSearch( latLng );
				} else {
					console.log('GEOCODER ERROR', status)
					_this.showVisibleMarkers()
					// geocodeErrors( status );
				}
			});
		}

		prepareStoreSearch(latLng) {
			this.map.setCenter(latLng);
			this.showVisibleMarkers(latLng)
		}

		prepareListItems(elements) {
			this.storeData = '' // clear
			this.storeList.innerHTML = ''

			for (let index = 0; index < elements.length; index++) {
				const element = elements[index]?.element;
				
				let htmlStore = `
					<li data-store-id="${element.wpsl_id}">
						<div class="wpsl-store-location">
							<p>
								<strong>${element.name}</strong>
								<span class="distance">${element.distanceToMile ? element.distanceToMile+' Miles' : ''}</span>
								<span class="wpsl-street">${element.address}</span>
								<span>${element.city} ${element.state} ${element.zip}</span>
							</p>
							<p class="wpsl-contact-details">
								<span><a href="tel:${element.phone.replace('(', '').replace(')', '').replace(' ', '').replace('-', '')}">${element.phone}</a></span>
								<span><a target="_blank" href="${element.url}">${element.url}</a></span>
							</p>
							${element.url ? '<a class="btn" target="_blank" href="'+element.url+'">Contact Dealer <span class="button-arrow"></span></a>' : ''}
						</div>
						<div class="note-wrap">Please contact dealer to inquire about which White's Boots products are carried.</div>
					</li>
				`;

				this.storeData = this.storeData + htmlStore;
			}

			if(elements.length == 0){
				this.storeData = "<li class='wpsl-no-results-msg'>No results found</li>";
			}

			this.storeList.innerHTML = this.storeData;
		}
  }
  
  customElements.define('dealer-locator', DealerLocator);
  