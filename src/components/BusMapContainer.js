import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import busService from '../services/busService';
import LeafletMap from './LeafletMap';

const BusMapContainer = ({ onBusSelect, initialLines = [] }) => {
	const [buses, setBuses] = useState([]);
	const [selectedBuses, setSelectedBuses] = useState([]); // Track selected buses
	const [availableLines, setAvailableLines] = useState([]); // Keep for potential future use
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [lastUpdate, setLastUpdate] = useState(null);
	const [refreshInterval, setRefreshInterval] = useState(null);
	const [hasInitialSelection, setHasInitialSelection] = useState(false); // Track if initial selection was made

	useEffect(() => {
		fetchBuses();
		
		// Set up auto-refresh every 10 seconds
		const interval = setInterval(fetchBuses, 10000);
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

	const fetchBuses = async () => {
		try {
			setLoading(true);
			setError(null);

			const allBuses = await busService.getLiveBuses();
			
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

	const unselectLine = (lineNumber) => {
		setSelectedBuses(prev => 
			prev.filter(bus => bus.lineNumber !== lineNumber)
		);
		console.log('BusMapContainer: Unselected line:', lineNumber);
	};

	const handleBusSelect = (bus) => {
		console.log('Selected bus:', bus);
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
	const displayBuses = selectedBuses;

	return (
		<View style={styles.container}>
			{/* Active Buses Section */}
			<View style={styles.controlPanel}>
				<Text style={styles.sectionTitle}>Active Buses ({buses.length})</Text>
				<ScrollView 
					horizontal 
					showsHorizontalScrollIndicator={true}
					style={styles.busesSelection}
					contentContainerStyle={styles.busesSelectionContent}
				>
					{buses.map((bus, index) => (
						<TouchableOpacity
							key={`${bus.busNumber}-${bus.tripId}-${index}`}
							style={[
								styles.busButton,
								isBusSelected(bus) && styles.busButtonActive
							]}
							onPress={() => toggleBusSelection(bus)}
						>
							<Text style={[
								styles.busButtonLine,
								isBusSelected(bus) && styles.busButtonLineActive
							]}>Line {bus.lineNumber}</Text>
							<Text style={[
								styles.busButtonNumber,
								isBusSelected(bus) && styles.busButtonNumberActive
							]}>#{bus.busNumber}</Text>
						</TouchableOpacity>
					))}
				</ScrollView>

				{/* Selected buses on map section */}
				{selectedBuses.length > 0 && (
					<View style={styles.selectedBusesSection}>
						<Text style={styles.selectedBusesTitle}>Selected buses on map</Text>
						<ScrollView 
							horizontal 
							showsHorizontalScrollIndicator={false}
							style={styles.selectedBusesScroll}
							contentContainerStyle={styles.selectedBusesContent}
						>
							{[...new Set(selectedBuses.map(bus => bus.lineNumber))].map(lineNumber => (
								<TouchableOpacity
									key={lineNumber}
									style={styles.selectedLineButton}
									onPress={() => unselectLine(lineNumber)}
								>
									<Text style={styles.selectedLineText}>{lineNumber}</Text>
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
						<Text style={styles.refreshText}>🔄</Text>
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
	busesSelection: {
		marginBottom: 15,
		maxHeight: 60,
	},
	busesSelectionContent: {
		alignItems: 'center',
		paddingHorizontal: 5,
	},
	busButton: {
		backgroundColor: '#f8f9fa',
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 8,
		marginRight: 8,
		borderWidth: 1,
		borderColor: '#ddd',
		alignItems: 'center',
		minWidth: 60,
	},
	busButtonActive: {
		backgroundColor: '#0066cc',
		borderColor: '#0066cc',
	},
	busButtonLine: {
		color: '#0066cc',
		fontSize: 12,
		fontWeight: 'bold',
	},
	busButtonLineActive: {
		color: '#fff',
	},
	busButtonNumber: {
		color: '#666',
		fontSize: 10,
	},
	busButtonNumberActive: {
		color: '#fff',
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
	selectedLineButton: {
		backgroundColor: '#0066cc',
		padding: 4,
		borderRadius: 20,
		marginRight: 8,
		width: 30,
		height: 30,
		alignItems: 'center',
		justifyContent: 'center',
	},
	selectedLineText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: 'bold',
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
		padding: 8,
		borderRadius: 4,
		backgroundColor: '#f0f0f0',
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
});

export default BusMapContainer;
