import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Alert,
	Platform,
	Modal,
	TouchableOpacity,
} from 'react-native';
import BusMapContainer from '../components/BusMapContainer';
import { Feather } from '@expo/vector-icons';
import { MapIcon, BusIcon } from '../components/Icons';

const MapScreen = ({ route, navigation }) => {
	const [selectedBus, setSelectedBus] = useState(null);
	const specificBus = route?.params?.bus;
	const selectedLineFromParams = route?.params?.selectedLine;
	const initialLinesFromParams = route?.params?.initialLines;

	// Debug logging
	useEffect(() => {
		console.log('MapScreen: Route params:', route?.params);
		console.log('MapScreen: Initial lines from params:', initialLinesFromParams);
		console.log('MapScreen: Selected line from params:', selectedLineFromParams);
		console.log('MapScreen: Specific bus from params:', specificBus);

		// Clear selected bus when route params change
		setSelectedBus(null);
	}, [route, initialLinesFromParams, selectedLineFromParams, specificBus]);

	const handleBusSelect = (bus) => {
		setSelectedBus(bus);
		console.log('Selected bus on map:', bus);

		// Navigate to line details if needed
		// navigation.navigate('LineDetails', { bus });
	};

	const handleBusUpdate = (updatedBus) => {
		console.log('MapScreen: Received updated bus data:', {
			busNumber: updatedBus.busNumber,
			nextStop: updatedBus.nextStop,
			arrivalTime: updatedBus.arrivalTime,
			hasNextStop: !!updatedBus.nextStop,
			nextStopType: typeof updatedBus.nextStop
		});
		if (selectedBus &&
			selectedBus.busNumber === updatedBus.busNumber &&
			selectedBus.tripId === updatedBus.tripId) {
			console.log('MapScreen: Updating selectedBus state with fresh data');
			setSelectedBus(updatedBus);
		} else {
			console.log('MapScreen: Bus update ignored - bus not currently selected or different bus');
		}
	};	// If a specific bus was passed, show its location
	if (specificBus) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Bus Location - Line {specificBus.lineNumber}</Text>
				<BusMapContainer
					onBusSelect={handleBusSelect}
					onBusUpdate={handleBusUpdate}
					initialLines={[specificBus.lineNumber]}
				/>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				<MapIcon size={22} color='#e5e5e5' style={styles.mapIconStyle} /> Live Bus Map {Platform.OS === 'web' ? '(Interactive)' : '(Web Only)'}
				{selectedLineFromParams && ` - Line ${selectedLineFromParams}`}
			</Text>
			<BusMapContainer
				onBusSelect={handleBusSelect}
				onBusUpdate={handleBusUpdate}
				initialLines={initialLinesFromParams}
			/>			{/* Selected Bus Modal */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={!!selectedBus}
				onRequestClose={() => setSelectedBus(null)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setSelectedBus(null)}
				>
					<View style={styles.modalContent} onStartShouldSetResponder={() => true}>
						{/* Close Button */}
						<TouchableOpacity
							style={styles.closeButton}
							onPress={() => {
								console.log('Close button pressed');
								setSelectedBus(null);
							}}
						>
							<Feather name="x" size={24} color="#666" />
						</TouchableOpacity>

						{/* Modal Title */}
						<Text style={styles.modalTitle}>
							<BusIcon size={22} color='#e5e5e5' style={styles.mapIconStyle} /> Line {selectedBus?.lineNumber} - Bus #{selectedBus?.busNumber}
						</Text>

						{/* Route */}
						<View style={styles.modalSection}>
							<Text style={styles.modalSectionTitle}>Route</Text>
							<Text style={styles.modalSectionContent}>
								{selectedBus?.route || 'N/A'}
							</Text>
						</View>

						{/* Destination */}
						<View style={styles.modalSection}>
							<Text style={styles.modalSectionTitle}>Destination</Text>
							<Text style={styles.modalSectionContent}>
								{selectedBus?.destination || 'N/A'}
							</Text>
						</View>

						{/* Next Stop */}
						<View style={styles.modalSection}>
							<Text style={styles.modalSectionTitle}>Next Stop</Text>
							<Text style={styles.modalSectionContent}>
								{(() => {
									const nextStop = selectedBus?.nextStop;
									const arrivalTime = selectedBus?.arrivalTime;
									console.log('Modal rendering nextStop:', {
										nextStop,
										arrivalTime,
										nextStopType: typeof nextStop,
										isEnRoute: nextStop === 'En route',
										hasNextStop: !!nextStop,
										fullBus: selectedBus
									});

									// More robust check for valid next stop
									if (nextStop && nextStop !== 'En route' && nextStop !== 'N/A' && nextStop.trim() !== '') {
										return `${nextStop} - ${arrivalTime || 'Live'}`;
									}
									return 'En route';
								})()}
							</Text>
						</View>

						{/* View Schedule Button */}
						<TouchableOpacity
							style={styles.scheduleButton}
							onPress={() => {
								setSelectedBus(null);
								navigation.navigate('LineDetails', {
									bus: {
										lineNumber: selectedBus.lineNumber,
										destination: selectedBus.destination,
										route: selectedBus.route,
									}
								});
							}}
						>
							<Text style={styles.scheduleButtonText}>View Bus Schedule</Text>
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	mapIconStyle: {
		marginRight: 6,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		padding: 20,
		textAlign: 'center',
		backgroundColor: '#0066cc',
		color: 'white',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		width: '90%',
		maxWidth: 400,
		maxHeight: '80%',
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		position: 'relative',
	},
	closeButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		padding: 8,
		borderRadius: 20,
		backgroundColor: '#f5f5f5',
		zIndex: 10,
		elevation: 10,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#0066cc',
		textAlign: 'center',
		marginBottom: 20,
		marginTop: 10,
	},
	modalSection: {
		marginBottom: 15,
	},
	modalSectionTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 4,
	},
	modalSectionContent: {
		fontSize: 16,
		color: '#666',
		lineHeight: 22,
	},
	scheduleButton: {
		backgroundColor: '#0066cc',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 20,
	},
	scheduleButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});

export default MapScreen;
