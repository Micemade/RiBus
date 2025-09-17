import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';

// Leaflet map component for web only
const LeafletMap = ({ buses, selectedLines, onBusSelect }) => {
	const [map, setMap] = useState(null);
	const [leaflet, setLeaflet] = useState(null);
	const [markers, setMarkers] = useState([]);
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const previousBusesRef = useRef(null);

	useEffect(() => {
		// Only load Leaflet on web platform
		if (Platform.OS === 'web') {
			loadLeaflet();
		}

		// Cleanup function
		return () => {
			if (map) {
				map.remove();
				setMap(null);
				setMarkers([]);
			}
		};
	}, []);

	const loadLeaflet = async () => {
		try {
			// Check if already loaded
			if (leaflet) {
				return;
			}

			// Dynamic import for web-only
			const L = await import('leaflet');
			await import('leaflet/dist/leaflet.css');
			
			// Fix marker icons for Leaflet
			delete L.Icon.Default.prototype._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
				iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
			});

			setLeaflet(L);
			initMap(L);
		} catch (error) {
			console.error('Error loading Leaflet:', error);
		}
	};

	const initMap = (L) => {
		// Check if map already exists to prevent multiple initializations
		if (map) {
			return;
		}

		// Center on Rijeka, Croatia
		const newMap = L.map('bus-map').setView([45.3271, 14.4422], 13);

		// Add OpenStreetMap tiles
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(newMap);

		setMap(newMap);
	};

	useEffect(() => {
		// Check if buses actually changed
		const busesChanged = !previousBusesRef.current ||
			JSON.stringify(buses) !== JSON.stringify(previousBusesRef.current);

		if (map && leaflet && busesChanged) {
			previousBusesRef.current = [...buses];
			updateBusMarkers();
		}
	}, [map, leaflet, buses, selectedLines]);

	const updateBusMarkers = () => {

		// Store current view if map exists
		let currentView = null;
		if (map && !isFirstLoad) {
			currentView = {
				center: map.getCenter(),
				zoom: map.getZoom()
			};
		}
		
		// Clear ALL existing markers from the map
		let removedCount = 0;
		map.eachLayer((layer) => {
			// Remove all markers and marker-like layers
			if (layer instanceof leaflet.Marker || layer.options && layer.options.icon) {
				map.removeLayer(layer);
				removedCount++;
			}
		});

		// Also clear our tracked markers array
		setMarkers([]);

		// If no buses to display, just return
		if (buses.length === 0) {
			return;
		}

		const newMarkers = [];
		
		// Filter buses by selected lines
		const filteredBuses = buses.filter(bus => 
			selectedLines.length === 0 || selectedLines.includes(bus.lineNumber)
		);

		filteredBuses.forEach(bus => {
			if (bus.latitude && bus.longitude) {
				// Create custom icon for bus
				const busIcon = leaflet.divIcon({
					html: `<div style="
						background-color: ${getBusColor(bus.lineNumber)};
						color: white;
						border-radius: 50%;
						width: 30px;
						height: 30px;
						display: flex;
						align-items: center;
						justify-content: center;
						font-weight: bold;
						font-size: 12px;
						border: 2px solid white;
						box-shadow: 0 2px 4px rgba(0,0,0,0.3);
					">${bus.lineNumber}</div>`,
					className: 'bus-marker',
					iconSize: [30, 30],
					iconAnchor: [15, 15]
				});

				const marker = leaflet.marker([bus.latitude, bus.longitude], { icon: busIcon })
					.addTo(map);

				// Add click event
				marker.on('click', () => {
					if (onBusSelect) {
						onBusSelect(bus);
					}
				});

				newMarkers.push(marker);
			}
		});

		setMarkers(newMarkers);

		// Handle view restoration or initial fitting
		if (currentView) {
			// Restore previous view position and zoom
			map.setView(currentView.center, currentView.zoom);
		} else if (isFirstLoad && newMarkers.length > 0) {
			// Only fit bounds on first load
			const group = leaflet.featureGroup(newMarkers);
			map.fitBounds(group.getBounds().pad(0.1));
			setIsFirstLoad(false);
		}
	}; const getBusColor = (lineNumber) => {
		// Assign colors based on line number
		const colors = [
			'#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
			'#9b59b6', '#1abc9c', '#34495e', '#e67e22',
			'#f1c40f', '#95a5a6', '#16a085', '#8e44ad'
		];
		const hash = lineNumber.split('').reduce((a, b) => {
			a = ((a << 5) - a) + b.charCodeAt(0);
			return a & a;
		}, 0);
		return colors[Math.abs(hash) % colors.length];
	};

	if (Platform.OS !== 'web') {
		return (
			<View style={styles.fallbackContainer}>
				<Text style={styles.fallbackText}>
					🗺️ Map view is only available on web platform
				</Text>
				<Text style={styles.fallbackSubtext}>
					Use the web version to see interactive bus locations
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.mapContainer}>
			<div
				id="bus-map"
				style={{
					width: '100%',
					height: '100%',
					borderRadius: '8px'
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	mapContainer: {
		flex: 1,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: '#e0f7fa',
	},
	fallbackContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#e0f7fa',
		borderRadius: 8,
		padding: 20,
	},
	fallbackText: {
		fontSize: 18,
		color: '#666',
		textAlign: 'center',
		marginBottom: 10,
	},
	fallbackSubtext: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
	},
});

export default LeafletMap;
