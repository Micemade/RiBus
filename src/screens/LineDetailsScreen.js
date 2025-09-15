import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import RidesList from '../components/RidesList';
import cachedBusService from '../services/cachedBusService';

const LineDetailsScreen = ({ route, navigation }) => {
	const { bus } = route.params;
	const [rides, setRides] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadSchedule();
	}, []);

	const loadSchedule = async () => {
		try {
			// Load rides data
			const ridesData = await cachedBusService.getBusScheduleByRides(bus.lineNumber);
			
			// Log more detailed info if rides are empty
			if (ridesData.length === 0) {
				console.warn('LineDetailsScreen: No rides found for line', bus.lineNumber);
			}

			setRides(ridesData);
			setLoading(false);
		} catch (error) {
			console.error('LineDetailsScreen: Error loading schedule:', error);
			console.error('LineDetailsScreen: Error details:', error.message);
			console.error('LineDetailsScreen: Error stack:', error.stack);
			setLoading(false);
		}
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.lineNumber}>{bus.lineNumber}</Text>
				<Text style={styles.destination}>To: {bus.destination}</Text>
				<Text style={styles.route}>{bus.route}</Text>
				<Text style={styles.status}>Status: {bus.status}</Text>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Schedule</Text>
				
				{loading ? (
					<Text style={styles.loadingText}>Loading schedule...</Text>
				) : rides.length > 0 ? (
					<View style={styles.ridesContainer}>
						<RidesList
							rides={rides}
							direction={bus.direction || bus.smjerNaziv || bus.directionName || ''}
						/>
					</View>
				) : (
					<Text style={styles.noDataText}>No rides available</Text>
				)}
			</View>

			<View style={styles.mapButtonContainer}>
				<TouchableOpacity
					style={styles.mapButton}
					onPress={() => navigation.navigate('Map', { bus })}
				>
					<Text style={styles.mapButtonText}>View on Map</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	header: {
		backgroundColor: '#0066cc',
		padding: 20,
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
	},
	lineNumber: {
		fontSize: 24,
		fontWeight: 'bold',
		color: 'white',
	},
	destination: {
		fontSize: 18,
		color: 'white',
		marginTop: 5,
	},
	route: {
		fontSize: 14,
		color: '#e0f7fa',
		marginTop: 5,
	},
	status: {
		fontSize: 12,
		color: '#fff',
		marginTop: 10,
	},
	section: {
		margin: 15,
		flex: 1,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
	},
	ridesContainer: {
		flex: 1,
		minHeight: 400,
	},
	loadingText: {
		textAlign: 'center',
		color: '#666',
		fontSize: 16,
		padding: 20,
	},
	noDataText: {
		textAlign: 'center',
		color: '#666',
		fontSize: 16,
		padding: 20,
	},
	mapButtonContainer: {
		alignItems: 'center',
		marginVertical: 20,
	},
	mapButton: {
		backgroundColor: '#0066cc',
		paddingVertical: 15,
		paddingHorizontal: 30,
		borderRadius: 25,
	},
	mapButtonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16,
	},
});

export default LineDetailsScreen;
