import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Alert,
	Platform,
} from 'react-native';
import BusMapContainer from '../components/BusMapContainer';

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

	// If a specific bus was passed, show its location
	if (specificBus) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Bus Location - Line {specificBus.lineNumber}</Text>
				<BusMapContainer
					onBusSelect={handleBusSelect}
					initialLines={[specificBus.lineNumber]}
				/>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				🗺️ Live Bus Map {Platform.OS === 'web' ? '(Interactive)' : '(Web Only)'}
				{selectedLineFromParams && ` - Line ${selectedLineFromParams}`}
			</Text>
			<BusMapContainer
				onBusSelect={handleBusSelect}
				initialLines={initialLinesFromParams}
			/>			{selectedBus && (
				<View style={styles.selectedBusInfo}>
					<Text style={styles.selectedBusTitle}>
						🚌 Selected: Line {selectedBus.lineNumber} - Bus #{selectedBus.busNumber}
					</Text>
					<Text style={styles.selectedBusDetails}>
						{selectedBus.route} → {selectedBus.destination}
					</Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		padding: 20,
		textAlign: 'center',
		backgroundColor: '#0066cc',
		color: 'white',
	},
	selectedBusInfo: {
		backgroundColor: '#fff',
		padding: 15,
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0',
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	selectedBusTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0066cc',
		marginBottom: 5,
	},
	selectedBusDetails: {
		fontSize: 14,
		color: '#666',
	},
});

export default MapScreen;
