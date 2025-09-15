import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import busService from '../services/busService';

const LiveBusMonitor = ({ visible, onClose }) => {
	const [liveBuses, setLiveBuses] = useState([]);
	const [previousBuses, setPreviousBuses] = useState([]); // Track previous positions
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastUpdate, setLastUpdate] = useState(null);
	const [error, setError] = useState(null);
	const [refreshInterval, setRefreshInterval] = useState(null);
	const [selectedLines, setSelectedLines] = useState(['1', '6']); // Monitor these lines
	const [stats, setStats] = useState({
		totalBuses: 0,
		activeBuses: 0,
		linesActive: 0,
		movedBuses: 0
	});

	// Fetch live bus data
	const fetchLiveBuses = async () => {
		try {
			setIsRefreshing(true);
			setError(null);
			
			// If no lines selected, clear data and return
			if (selectedLines.length === 0) {
				setLiveBuses([]);
				setStats({
					totalBuses: 0,
					activeBuses: 0,
					linesActive: 0,
					movedBuses: 0
				});
				setIsRefreshing(false);
				return;
			}
			
			const buses = await busService.getLiveBuses();
			
			// Filter buses for selected lines only
			const filteredBuses = buses.filter(bus => 
				selectedLines.includes(bus.lineNumber)
			);
			
			// Compare with previous positions and mark changes
			const busesWithMovement = filteredBuses.map(bus => {
				const busKey = `${bus.busNumber}-${bus.tripId}`;
				const previousBus = previousBuses.find(prev => 
					`${prev.busNumber}-${prev.tripId}` === busKey
				);
				
				let hasMovedRecently = false;
				let distanceMoved = 0;
				
				if (previousBus) {
					// Calculate if coordinates changed (even slightly)
					const latChanged = Math.abs(bus.latitude - previousBus.latitude) > 0.000001;
					const lonChanged = Math.abs(bus.longitude - previousBus.longitude) > 0.000001;
					hasMovedRecently = latChanged || lonChanged;
					
					// Calculate approximate distance moved (in meters)
					if (hasMovedRecently) {
						const R = 6371000; // Earth's radius in meters
						const dLat = (bus.latitude - previousBus.latitude) * Math.PI / 180;
						const dLon = (bus.longitude - previousBus.longitude) * Math.PI / 180;
						const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
								Math.cos(previousBus.latitude * Math.PI / 180) * Math.cos(bus.latitude * Math.PI / 180) *
								Math.sin(dLon/2) * Math.sin(dLon/2);
						const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
						distanceMoved = R * c;
					}
				}
				
				return {
					...bus,
					moved: hasMovedRecently,
					distance: distanceMoved,
					isNew: !previousBus
				};
			});
			
			// Store current buses as previous for next comparison
			setPreviousBuses(filteredBuses);
			setLiveBuses(busesWithMovement);
			setLastUpdate(new Date());
			
			// Calculate stats
			const activeLinesSet = new Set(filteredBuses.map(bus => bus.lineNumber));
			const movedBuses = busesWithMovement.filter(bus => bus.moved).length;
			
			setStats({
				totalBuses: buses.length,
				activeBuses: filteredBuses.length,
				linesActive: activeLinesSet.size,
				movedBuses: movedBuses
			});
			
			console.log(`LiveBusMonitor: Updated ${filteredBuses.length} buses from ${selectedLines.length} monitored lines (${movedBuses} moved)`);
			console.log('LiveBusMonitor: Selected lines:', selectedLines);
			console.log('LiveBusMonitor: Filtered bus lines:', filteredBuses.map(b => b.lineNumber));
			
		} catch (err) {
			console.error('LiveBusMonitor: Error fetching buses:', err);
			setError(err.message);
		} finally {
			setIsRefreshing(false);
		}
	};

	// Update immediately when selected lines change
	useEffect(() => {
		if (visible && selectedLines.length > 0) {
			console.log('LiveBusMonitor: Lines changed, updating immediately:', selectedLines);
			fetchLiveBuses();
		}
	}, [selectedLines]);

	// Start/stop auto-refresh
	useEffect(() => {
		if (visible) {
			// Initial fetch
			fetchLiveBuses();
			
			// Set up auto-refresh every 8 seconds
			const interval = setInterval(fetchLiveBuses, 8000);
			setRefreshInterval(interval);
			
			return () => {
				if (interval) {
					clearInterval(interval);
				}
			};
		} else {
			// Clear interval when not visible
			if (refreshInterval) {
				clearInterval(refreshInterval);
				setRefreshInterval(null);
			}
		}
	}, [visible]);

	// Toggle line monitoring
	const toggleLineMonitoring = (lineNumber) => {
		setSelectedLines(prev => 
			prev.includes(lineNumber)
				? prev.filter(line => line !== lineNumber)
				: [...prev, lineNumber]
		);
	};

	// Manual refresh
	const handleManualRefresh = () => {
		fetchLiveBuses();
	};

	// Format coordinates for display
	const formatCoordinate = (coord) => {
		return coord ? coord.toFixed(6) : 'N/A';
	};

	// Get time since last update
	const getTimeSinceUpdate = () => {
		if (!lastUpdate) return 'Never';
		const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
		return `${seconds}s ago`;
	};

	if (!visible) return null;

	const availableLines = ['1', '2', '4', '5', '6', '7A', '20','21', '32'];

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>🚌 Live Bus Monitor</Text>
				<TouchableOpacity onPress={onClose} style={styles.closeButton}>
					<Text style={styles.closeText}>✕</Text>
				</TouchableOpacity>
			</View>

			{/* Stats Dashboard */}
			<View style={styles.statsContainer}>
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{stats.totalBuses}</Text>
					<Text style={styles.statLabel}>Total Buses</Text>
				</View>
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{stats.activeBuses}</Text>
					<Text style={styles.statLabel}>Monitored</Text>
				</View>
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{stats.linesActive}/{selectedLines.length}</Text>
					<Text style={styles.statLabel}>Lines Active</Text>
				</View>
				<View style={styles.statItem}>
					<Text style={[styles.statValue, stats.movedBuses > 0 && styles.statValueMoved]}>{stats.movedBuses}</Text>
					<Text style={styles.statLabel}>Moved</Text>
				</View>
			</View>

			{/* Line Selection */}
			<View style={styles.lineSelection}>
				<Text style={styles.sectionTitle}>Monitor Lines:</Text>
				<View style={styles.lineButtons}>
					{availableLines.map(line => (
						<TouchableOpacity
							key={line}
							style={[
								styles.lineButton,
								selectedLines.includes(line) && styles.lineButtonActive
							]}
							onPress={() => toggleLineMonitoring(line)}
						>
							<Text style={[
								styles.lineButtonText,
								selectedLines.includes(line) && styles.lineButtonTextActive
							]}>
								{line}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Status Bar */}
			<View style={styles.statusBar}>
				<View style={styles.statusLeft}>
					<View style={[styles.statusIndicator, isRefreshing && styles.statusRefreshing]} />
					<Text style={styles.statusText}>
						{isRefreshing ? 'Refreshing...' : `Updated ${getTimeSinceUpdate()}`}
					</Text>
				</View>
				<TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
					<Text style={styles.refreshText}>🔄</Text>
				</TouchableOpacity>
			</View>

			{/* Error Display */}
			{error && (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>❌ {error}</Text>
				</View>
			)}

			{/* Live Bus List */}
			<ScrollView style={styles.busContainer} showsVerticalScrollIndicator={false} id='bus-lines-container'>
				<Text style={styles.sectionTitle}>Lines List with Data:</Text>
				{liveBuses.filter(bus => selectedLines.includes(bus.lineNumber)).length === 0 ? (
					<View style={styles.noBusesContainer}>
						<Text style={styles.noBusesText}>
							{isRefreshing 
								? 'Loading buses...' 
								: selectedLines.length === 0 
									? 'Please select lines to monitor above'
									: 'No buses found for selected lines'
							}
						</Text>
					</View>
				) : (
					liveBuses
						.filter(bus => selectedLines.includes(bus.lineNumber)) // Double filter for safety
						.map((bus, index) => (
						<View key={`${bus.busNumber}-${bus.tripId}-${index}`} style={styles.busItem}>
							<View style={styles.busHeader}>
								<Text style={styles.busLine}>Line {bus.lineNumber}</Text>
								<Text style={styles.busNumber}>Bus #{bus.busNumber}</Text>
								<View style={styles.indicatorsContainer}>
									{bus.moved && (
										<View style={styles.movedIndicator}>
											<Text style={styles.movedText}>📍 MOVED</Text>
											<Text style={styles.distanceText}>{bus.distance.toFixed(0)}m</Text>
										</View>
									)}
									<View style={styles.liveIndicator}>
										<Text style={styles.liveText}>LIVE</Text>
									</View>
								</View>
							</View>
							
							<Text style={styles.busRoute} numberOfLines={1}>
								🛣️ {bus.route}
							</Text>
							
							<Text style={styles.busDestination} numberOfLines={1}>
								📍 To: {bus.destination}
							</Text>
							
							<Text style={styles.busNextStop} numberOfLines={1}>
								⏱️ Next: {bus.nextStop} ({bus.arrivalTime})
							</Text>
							
							<View style={styles.coordinatesContainer}>
								<Text style={styles.coordinates}>
									📍 {formatCoordinate(bus.latitude)}, {formatCoordinate(bus.longitude)}
								</Text>
								<Text style={styles.tripId}>Trip: {bus.tripId}</Text>
							</View>
						</View>
					))
				)}
			</ScrollView>

			{/* Footer Info */}
			<View style={styles.footer}>
				<Text style={styles.footerText}>
					Auto-refresh: 8s | Monitoring {selectedLines.length} lines
				</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 50,
		left: 10,
		right: 10,
		bottom: 100,
		backgroundColor: 'rgba(0, 0, 0, 0.95)',
		borderRadius: 12,
		padding: 15,
		zIndex: 1000,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
		paddingBottom: 10,
	},
	title: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	closeButton: {
		padding: 5,
	},
	closeText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 15,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 8,
		padding: 10,
	},
	statItem: {
		alignItems: 'center',
	},
	statValue: {
		color: '#4CAF50',
		fontSize: 24,
		fontWeight: 'bold',
	},
	statValueMoved: {
		color: '#FF5722',
	},
	statLabel: {
		color: '#ccc',
		fontSize: 12,
		marginTop: 2,
	},
	lineSelection: {
		marginBottom: 15,
	},
	sectionTitle: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	lineButtons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 5,
	},
	lineButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 15,
		marginRight: 5,
		marginBottom: 5,
	},
	lineButtonActive: {
		backgroundColor: '#2196F3',
	},
	lineButtonText: {
		color: '#ccc',
		fontSize: 12,
		fontWeight: 'bold',
	},
	lineButtonTextActive: {
		color: '#fff',
	},
	statusBar: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
		paddingHorizontal: 5,
	},
	statusLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	statusIndicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#4CAF50',
		marginRight: 8,
	},
	statusRefreshing: {
		backgroundColor: '#FF9800',
	},
	statusText: {
		color: '#ccc',
		fontSize: 12,
	},
	refreshButton: {
		padding: 5,
	},
	refreshText: {
		fontSize: 16,
	},
	errorContainer: {
		backgroundColor: 'rgba(244, 67, 54, 0.2)',
		padding: 10,
		borderRadius: 5,
		marginBottom: 10,
	},
	errorText: {
		color: '#F44336',
		fontSize: 12,
	},
	busContainer: {
		flex: 1,
	},
	noBusesContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	noBusesText: {
		color: '#ccc',
		fontSize: 14,
		textAlign: 'center',
	},
	busItem: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		padding: 12,
		marginBottom: 8,
		borderRadius: 8,
		borderLeftWidth: 4,
		borderLeftColor: '#4CAF50',
	},
	busHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	busLine: {
		color: '#2196F3',
		fontSize: 16,
		fontWeight: 'bold',
	},
	busNumber: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
	indicatorsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	liveIndicator: {
		backgroundColor: '#4CAF50',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 3,
	},
	liveText: {
		color: '#fff',
		fontSize: 10,
		fontWeight: 'bold',
	},
	movedIndicator: {
		backgroundColor: '#FF5722',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 3,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	movedText: {
		color: '#fff',
		fontSize: 9,
		fontWeight: 'bold',
	},
	distanceText: {
		color: '#fff',
		fontSize: 8,
		fontWeight: 'bold',
	},
	busRoute: {
		color: '#fff',
		fontSize: 13,
		marginBottom: 4,
	},
	busDestination: {
		color: '#ccc',
		fontSize: 12,
		marginBottom: 4,
	},
	busNextStop: {
		color: '#FF9800',
		fontSize: 12,
		marginBottom: 8,
	},
	coordinatesContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	coordinates: {
		color: '#4CAF50',
		fontSize: 11,
		fontFamily: 'monospace',
	},
	tripId: {
		color: '#666',
		fontSize: 10,
	},
	footer: {
		borderTopWidth: 1,
		borderTopColor: '#333',
		paddingTop: 10,
		marginTop: 10,
	},
	footerText: {
		color: '#666',
		fontSize: 11,
		textAlign: 'center',
	},
});

export default LiveBusMonitor;
