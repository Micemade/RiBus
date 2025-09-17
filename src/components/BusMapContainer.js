import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import cachedBusService from '../services/cachedBusService';
import LeafletMap from './LeafletMap';
import { RefreshIcon } from './Icons';
import { getNextStation } from '../utils/rideStatusUtils';

const BusMapContainer = ({ onBusSelect, onBusUpdate, initialLines = [] }) => {
	const [buses, setBuses] = useState([]);
	const [selectedBuses, setSelectedBuses] = useState([]); // Track selected buses
	const [availableLines, setAvailableLines] = useState([]); // Keep for potential future use
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [lastUpdate, setLastUpdate] = useState(null);
	const [refreshInterval, setRefreshInterval] = useState(null);
	const [selectedBusRefreshInterval, setSelectedBusRefreshInterval] = useState(null);
	const [hasInitialSelection, setHasInitialSelection] = useState(false); // Track if initial selection was made
	const [currentlySelectedBus, setCurrentlySelectedBus] = useState(null); // Track the currently selected bus for updates

	useEffect(() => {
		fetchBuses();

		// Set up auto-refresh every 20 seconds
		const interval = setInterval(fetchBuses, 20000);
		setRefreshInterval(interval);

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, []);

	// Auto-select buses when initialLines are provided and buses are loaded (only once)
	useEffect(() => {
		if (initialLines && initialLines.length > 0 && buses.length > 0 && !hasInitialSelection) {
			const busesToSelect = buses.filter(bus => 
				initialLines.includes(bus.lineNumber)
			);
			setSelectedBuses(busesToSelect);
			setHasInitialSelection(true);
			console.log('BusMapContainer: Initial auto-selection completed for lines:', initialLines, 'buses:', busesToSelect.length);
		}
	}, [buses, initialLines, hasInitialSelection]);

	// Reset initial selection flag when initialLines change (new navigation)
	useEffect(() => {
		setHasInitialSelection(false);
		setSelectedBuses([]); // Clear selections for new navigation
		console.log('BusMapContainer: Reset for new navigation with initialLines:', initialLines);
	}, [JSON.stringify(initialLines)]); // Use JSON.stringify to avoid array reference issues

	// Manage selected bus refresh interval (6 seconds when buses are selected)
	useEffect(() => {
		let currentInterval = null;

		if (selectedBuses.length > 0) {
			// Start 6-second refresh interval for selected buses
			console.log('BusMapContainer: Starting selected bus refresh interval (6s)');
			currentInterval = setInterval(fetchSelectedBuses, 6000);
			setSelectedBusRefreshInterval(currentInterval);
		} else {
			// Stop interval when no buses are selected
			if (selectedBusRefreshInterval) {
				console.log('BusMapContainer: Stopping selected bus refresh interval');
				clearInterval(selectedBusRefreshInterval);
				setSelectedBusRefreshInterval(null);
			}
		}

		// Cleanup on unmount or when selectedBuses changes
		return () => {
			if (currentInterval) {
				console.log('BusMapContainer: Clearing selected bus refresh interval on cleanup');
				clearInterval(currentInterval);
			}
			if (selectedBusRefreshInterval && selectedBusRefreshInterval !== currentInterval) {
				clearInterval(selectedBusRefreshInterval);
			}
			setSelectedBusRefreshInterval(null);
		};
	}, [selectedBuses.length]); // Only depend on length to avoid unnecessary re-runs

	const fetchBuses = async () => {
		try {
			setLoading(true);
			setError(null);

			let allBuses = [];

			allBuses = await cachedBusService.getActiveBuses();
			
			// Preserve selected buses after data refresh by matching them with new data
			if (selectedBuses.length > 0) {
				const updatedSelectedBuses = selectedBuses.map(selectedBus => {
					// Try to find the same bus in new data
					const updatedBus = allBuses.find(bus => 
						bus.busNumber === selectedBus.busNumber && 
						bus.tripId === selectedBus.tripId &&
						bus.lineNumber === selectedBus.lineNumber
					);
					return updatedBus || selectedBus; // Use updated data if found, otherwise keep old data
				}).filter(bus => {
					// Keep only buses that still exist in the new data
					return allBuses.some(newBus => 
						newBus.busNumber === bus.busNumber && 
						newBus.tripId === bus.tripId &&
						newBus.lineNumber === bus.lineNumber
					);
				});
				
				if (updatedSelectedBuses.length !== selectedBuses.length) {
					console.log('BusMapContainer: Updated selected buses after data refresh:', updatedSelectedBuses.length, 'were:', selectedBuses.length);
					setSelectedBuses(updatedSelectedBuses);
				} else {
					setSelectedBuses(updatedSelectedBuses);
				}
			}
			
			setBuses(allBuses);
			setLastUpdate(new Date());
			
			// Extract unique line numbers and sort them
			const uniqueLines = [...new Set(allBuses.map(bus => bus.lineNumber))]
				.filter(line => line) // Remove any null/undefined values
				.sort((a, b) => {
					const aNum = parseInt(a) || 999;
					const bNum = parseInt(b) || 999;
					return aNum - bNum;
				});
			
			setAvailableLines(uniqueLines);
			
			console.log(`BusMapContainer: Loaded ${allBuses.length} buses from ${uniqueLines.length} lines`);
		} catch (err) {
			console.error('Error fetching buses for map:', err);
			setError('Failed to load bus data');
		} finally {
			setLoading(false);
		}
	};

	const fetchSelectedBuses = async () => {
		if (selectedBuses.length === 0) return;

		try {

			// Get unique line numbers from selected buses
			const uniqueLineNumbers = [...new Set(selectedBuses.map(bus => bus.lineNumber))];
			console.log(`BusMapContainer: Fetching ${selectedBuses.length} selected buses individually for lines:`, uniqueLineNumbers);

			// Fetch schedule data for all unique lines
			const schedulePromises = uniqueLineNumbers.map(lineNumber =>
				cachedBusService.getBusSchedule(lineNumber)
			);
			const scheduleDataArray = await Promise.all(schedulePromises);

			// Create a map of line number to schedule data
			const lineSchedules = new Map();
			uniqueLineNumbers.forEach((lineNumber, index) => {
				lineSchedules.set(lineNumber, scheduleDataArray[index] || []);
			});

			// Fetch each selected bus individually using the /autobus endpoint
			const updatedBuses = await Promise.all(
				selectedBuses.map(async (selectedBus) => {
					try {
						const response = await fetch(`https://api.autotrolej.hr/api/open/v1/voznired/autobus?gbr=${selectedBus.busNumber}`);
						if (!response.ok) {
							console.warn(`BusMapContainer: Failed to fetch bus ${selectedBus.busNumber}:`, response.status);
							return selectedBus; // Return original data if fetch fails
						}

						const busData = await response.json();
						if (busData.msg !== 'ok' || !busData.res) {
							console.warn(`BusMapContainer: Invalid response for bus ${selectedBus.busNumber}:`, busData.msg);
							return selectedBus; // Return original data if response is invalid
						}

						// Update the selected bus with fresh data
						const freshBus = busData.res;
						console.log(`BusMapContainer: Individual API response for bus ${selectedBus.busNumber}:`, {
							originalNextStop: selectedBus.nextStop,
							freshBusData: freshBus,
							freshBusType: typeof freshBus,
							isArray: Array.isArray(freshBus),
							freshBusKeys: freshBus ? Object.keys(freshBus) : 'N/A',
							fullResponse: busData
						});

						// Handle different response formats
						let nextStop, arrivalTime, latitude, longitude;
						if (Array.isArray(freshBus) && freshBus.length > 0) {
							// If it's an array, take the first item
							const busData = freshBus[0];
							nextStop = busData.nextStop;
							arrivalTime = busData.arrivalTime;
							latitude = busData.latitude || busData.lat;
							longitude = busData.longitude || busData.lon;
						} else if (freshBus && typeof freshBus === 'object') {
							// If it's an object
							nextStop = freshBus.nextStop;
							arrivalTime = freshBus.arrivalTime;
							latitude = freshBus.latitude || freshBus.lat;
							longitude = freshBus.longitude || freshBus.lon;
						}

						// Calculate correct next stop from schedule data
						let calculatedNextStop = nextStop || selectedBus.nextStop;
						let calculatedArrivalTime = arrivalTime || selectedBus.arrivalTime;

						try {
							const lineSchedule = lineSchedules.get(selectedBus.lineNumber) || [];
							console.log(`BusMapContainer: Looking for bus ${selectedBus.busNumber} in schedule for line ${selectedBus.lineNumber}, found ${lineSchedule.length} rides`);

							// Find the ride that matches this bus (by tripId or similar)
							const matchingRide = lineSchedule.find(ride => {
								// Try to match by tripId, or by having similar departure times
								if (ride.tripId === selectedBus.tripId) return true;

								// If no direct match, look for rides that are currently active
								if (ride.departures && ride.departures.length > 0) {
									const nextStation = getNextStation(ride);
									return nextStation !== null; // This ride has an upcoming station
								}
								return false;
							});

							if (matchingRide) {
								console.log(`BusMapContainer: Found matching ride for bus ${selectedBus.busNumber}:`, matchingRide);
								const nextStation = getNextStation(matchingRide);
								if (nextStation) {
									calculatedNextStop = nextStation.stop;
									calculatedArrivalTime = nextStation.time;
									console.log(`BusMapContainer: Calculated next stop for bus ${selectedBus.busNumber}: ${calculatedNextStop} at ${calculatedArrivalTime}`);
								} else {
									console.log(`BusMapContainer: No upcoming station found for bus ${selectedBus.busNumber}`);
								}
							} else {
								console.log(`BusMapContainer: No matching ride found for bus ${selectedBus.busNumber} in schedule data`);
							}
						} catch (scheduleError) {
							console.warn(`BusMapContainer: Error calculating next stop from schedule for bus ${selectedBus.busNumber}:`, scheduleError);
							// Fall back to API data
						}

						return {
							...selectedBus,
							latitude: latitude || selectedBus.latitude,
							longitude: longitude || selectedBus.longitude,
							// Use calculated data from schedule, fallback to fresh API data, then original
							nextStop: calculatedNextStop,
							arrivalTime: calculatedArrivalTime,
							// Preserve other properties
							lineNumber: selectedBus.lineNumber,
							route: selectedBus.route,
							destination: selectedBus.destination,
							tripId: selectedBus.tripId,
						};
					} catch (error) {
						console.warn(`BusMapContainer: Error fetching bus ${selectedBus.busNumber}:`, error);
						return selectedBus; // Return original data if fetch fails
					}
				})
			);

			// Update selected buses with fresh data
			setSelectedBuses(updatedBuses);
			console.log(`BusMapContainer: Updated ${updatedBuses.length} selected buses with fresh data`);

			// Notify parent component about updated bus data
			if (onBusUpdate && currentlySelectedBus) {
				const updatedSelectedBus = updatedBuses.find(bus =>
					bus.busNumber === currentlySelectedBus.busNumber &&
					bus.tripId === currentlySelectedBus.tripId
				);
				if (updatedSelectedBus) {
					console.log('BusMapContainer: Notifying parent of updated bus data:', updatedSelectedBus);
					onBusUpdate(updatedSelectedBus);
				}
			}

		} catch (error) {
			console.error('BusMapContainer: Error in fetchSelectedBuses:', error);
		}
	};

	const toggleBusSelection = (bus) => {
		const busKey = `${bus.busNumber}-${bus.tripId}`;
		setSelectedBuses(prev => {
			const isSelected = prev.some(selectedBus => 
				`${selectedBus.busNumber}-${selectedBus.tripId}` === busKey
			);
			
			if (isSelected) {
				return prev.filter(selectedBus => 
					`${selectedBus.busNumber}-${selectedBus.tripId}` !== busKey
				);
			} else {
				return [...prev, bus];
			}
		});
	};

	const isBusSelected = (bus) => {
		const busKey = `${bus.busNumber}-${bus.tripId}`;
		return selectedBuses.some(selectedBus => 
			`${selectedBus.busNumber}-${selectedBus.tripId}` === busKey
		);
	};

	const toggleLineSelection = (lineNumber) => {
		setSelectedBuses(prev => {
			const busesOnLine = buses.filter(bus => bus.lineNumber === lineNumber);
			const selectedBusesOnLine = prev.filter(bus => bus.lineNumber === lineNumber);

			if (selectedBusesOnLine.length === busesOnLine.length) {
				// All buses on this line are selected, so deselect them
				return prev.filter(bus => bus.lineNumber !== lineNumber);
			} else {
				// Not all buses are selected, so select all buses on this line
				const newSelections = busesOnLine.filter(bus =>
					!prev.some(selectedBus =>
						selectedBus.busNumber === bus.busNumber &&
						selectedBus.tripId === bus.tripId
					)
				);
				return [...prev, ...newSelections];
			}
		});
		console.log('BusMapContainer: Toggled line selection:', lineNumber);
	}; const isLineFullySelected = (lineNumber) => {
		const busesOnLine = buses.filter(bus => bus.lineNumber === lineNumber);
		const selectedBusesOnLine = selectedBuses.filter(bus => bus.lineNumber === lineNumber);
		return busesOnLine.length > 0 && selectedBusesOnLine.length === busesOnLine.length;
	};

	const handleBusSelect = (bus) => {
		console.log('BusMapContainer: Bus selected:', {
			busNumber: bus.busNumber,
			lineNumber: bus.lineNumber,
			nextStop: bus.nextStop,
			arrivalTime: bus.arrivalTime,
			route: bus.route,
			destination: bus.destination
		});
		setCurrentlySelectedBus(bus); // Track the currently selected bus
		if (onBusSelect) {
			onBusSelect(bus);
		}
	};

	const getTimeSinceUpdate = () => {
		if (!lastUpdate) return '';
		const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
		return `${seconds}s ago`;
	};

	// Filter buses for map display - show selected buses
	const displayBuses = useMemo(() => {
		return selectedBuses.length === 0 ? [] : buses.filter(bus =>
			selectedBuses.some(selectedBus =>
				selectedBus.busNumber === bus.busNumber &&
				selectedBus.tripId === bus.tripId &&
				selectedBus.lineNumber === bus.lineNumber
			)
		);
	}, [buses, selectedBuses]);

	return (
		<View style={styles.container}>
			{/* Lines Section */}
			<View style={styles.controlPanel}>
				<Text style={styles.sectionTitle}>Lines ({availableLines.length})</Text>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.linesSelection}
					contentContainerStyle={styles.linesSelectionContent}
				>
					{availableLines.map((lineNumber) => (
						<TouchableOpacity
							key={lineNumber}
							style={[
								styles.lineButton,
								isLineFullySelected(lineNumber) && styles.lineButtonActive
							]}
							onPress={() => toggleLineSelection(lineNumber)}
						>
							<Text style={[
								styles.lineButtonText,
								isLineFullySelected(lineNumber) && styles.lineButtonTextActive
							]}>{lineNumber}</Text>
						</TouchableOpacity>
					))}
				</ScrollView>

				{/* Selected buses on map section */}
				{selectedBuses.length > 0 && (
					<View style={styles.selectedBusesSection}>
						<Text style={styles.selectedBusesTitle}>Selected buses on map ({selectedBuses.length})</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.selectedBusesScroll}
							contentContainerStyle={styles.selectedBusesContent}
						>
							{selectedBuses.map((bus, index) => (
								<TouchableOpacity
									key={`${bus.busNumber}-${bus.tripId}-${index}`}
									style={styles.selectedBusButton}
									onPress={() => toggleBusSelection(bus)}
								>
									<Text style={styles.selectedBusLineText}>Line {bus.lineNumber}</Text>
									<Text style={styles.selectedBusNumberText}>#{bus.busNumber}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				)}

				{/* Status Bar */}
				<View style={styles.statusBar}>
					<View style={styles.statusLeft}>
						<View style={[styles.statusIndicator, loading && styles.statusLoading]} />
						<Text style={styles.statusText}>
							{loading ? 'Loading...' : `${displayBuses.length}/${buses.length} buses • Updated ${getTimeSinceUpdate()}`}
						</Text>
					</View>
					<TouchableOpacity onPress={fetchBuses} style={styles.refreshButton}>
						<RefreshIcon size={12} color='#888' style={styles.loaderIconStyle} />
					</TouchableOpacity>
				</View>

				{error && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>❌ {error}</Text>
					</View>
				)}
			</View>

			{/* Map Container */}
			<View style={styles.mapContainer}>
				<LeafletMap 
					buses={displayBuses}
					selectedLines={[]} // Show filtered buses
					onBusSelect={handleBusSelect}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	controlPanel: {
		backgroundColor: '#fff',
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
	},
	selectedBusesSection: {
		marginTop: 15,
		marginBottom: 10,
	},
	selectedBusesTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 8,
	},
	selectedBusesScroll: {
		maxHeight: 40,
	},
	selectedBusesContent: {
		alignItems: 'center',
		paddingHorizontal: 5,
	},
	selectedBusButton: {
		backgroundColor: '#0066cc',
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 8,
		marginRight: 8,
		borderWidth: 1,
		borderColor: '#0066cc',
		alignItems: 'center',
		minWidth: 60,
	},
	selectedBusLineText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: 'bold',
	},
	selectedBusNumberText: {
		color: '#fff',
		fontSize: 10,
	},
	statusBar: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	statusLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	statusIndicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#4CAF50',
		marginRight: 8,
	},
	statusLoading: {
		backgroundColor: '#FF9800',
	},
	statusText: {
		color: '#666',
		fontSize: 12,
		flex: 1,
	},
	refreshButton: {
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 20,
		backgroundColor: '#e3f2fd',
		borderWidth: 1,
		borderColor: '#bebfc0ff',
	},
	loaderIconStyle: {

	},
	refreshText: {
		fontSize: 16,
	},
	errorContainer: {
		backgroundColor: '#ffebee',
		padding: 10,
		borderRadius: 4,
		marginTop: 10,
	},
	errorText: {
		color: '#c62828',
		fontSize: 12,
	},
	mapContainer: {
		flex: 1,
		margin: 15,
		marginTop: 0,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: '#e0f7fa',
	},
	linesSelection: {
		marginBottom: 15,
		maxHeight: 50,
	},
	linesSelectionContent: {
		alignItems: 'center',
		paddingHorizontal: 5,
	},
	lineButton: {
		backgroundColor: '#f8f9fa',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
		marginRight: 8,
		borderWidth: 1,
		borderColor: '#ddd',
		alignItems: 'center',
		minWidth: 50,
	},
	lineButtonActive: {
		backgroundColor: '#0066cc',
		borderColor: '#0066cc',
	},
	lineButtonText: {
		color: '#0066cc',
		fontSize: 14,
		fontWeight: 'bold',
	},
	lineButtonTextActive: {
		color: '#fff',
	},
});

export default BusMapContainer;
