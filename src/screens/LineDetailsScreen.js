import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import ScheduleCard from '../components/ScheduleCard';
import RidesList from '../components/RidesList';
import DataAnalyzer from '../components/DataAnalyzer';
import cachedBusService from '../services/cachedBusService';

const LineDetailsScreen = ({ route, navigation }) => {
	const { bus } = route.params;
	const [schedule, setSchedule] = useState([]);
	const [rides, setRides] = useState([]);
	const [loading, setLoading] = useState(true);
	const [viewMode, setViewMode] = useState('rides'); // 'rides', 'schedule', 'debug'

	useEffect(() => {
		loadSchedule();
	}, []);

	const loadSchedule = async () => {
		try {
			console.log('LineDetailsScreen: Loading schedule for line:', bus.lineNumber);
			
			// Load both regular schedule and grouped rides
			const [scheduleData, ridesData] = await Promise.all([
				cachedBusService.getBusSchedule(bus.lineNumber),
				cachedBusService.getBusScheduleByRides(bus.lineNumber)
			]);
			
			console.log('LineDetailsScreen: Schedule data received:', scheduleData);
			console.log('LineDetailsScreen: Rides data received:', ridesData);
			console.log('LineDetailsScreen: Schedule length:', scheduleData.length);
			console.log('LineDetailsScreen: Rides count:', ridesData.length);
			
			setSchedule(scheduleData);
			setRides(ridesData);
			setLoading(false);
		} catch (error) {
			console.error('Error loading schedule:', error);
			setLoading(false);
		}
	};

	const renderSchedule = ({ item }) => (
		<ScheduleCard schedule={item} />
	);

	const toggleViewMode = () => {
		if (viewMode === 'debug') {
			setViewMode('rides');
		} else if (viewMode === 'rides') {
			setViewMode('schedule');
		} else {
			setViewMode('debug');
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
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Schedule</Text>
					<TouchableOpacity 
						style={styles.viewToggle}
						onPress={toggleViewMode}
					>
						<Text style={styles.viewToggleText}>
							{viewMode === 'debug' ? 'Debug View' : viewMode === 'rides' ? 'Rides View' : 'List View'}
						</Text>
					</TouchableOpacity>
				</View>
				
				{loading ? (
					<Text style={styles.loadingText}>Loading schedule...</Text>
				) : viewMode === 'debug' ? (
					<DataAnalyzer lineNumber={bus.lineNumber} />
				) : viewMode === 'rides' ? (
					rides.length > 0 ? (
						<View style={styles.ridesContainer}>
							<RidesList 
								rides={rides} 
								direction={bus.direction || bus.smjerNaziv || bus.directionName || ''} 
							/>
						</View>
					) : (
						<Text style={styles.noDataText}>No rides available</Text>
					)
				) : (
					schedule.length > 0 ? (
						<FlatList
							data={schedule}
							renderItem={renderSchedule}
							keyExtractor={(item) => item.id.toString()}
							showsVerticalScrollIndicator={false}
							style={styles.scheduleList}
						/>
					) : (
						<Text style={styles.noDataText}>No schedule available</Text>
					)
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
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	viewToggle: {
		backgroundColor: '#e3f2fd',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#0066cc',
	},
	viewToggleText: {
		color: '#0066cc',
		fontSize: 12,
		fontWeight: '600',
	},
	ridesContainer: {
		flex: 1,
		minHeight: 400,
	},
	scheduleList: {
		maxHeight: 400,
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
