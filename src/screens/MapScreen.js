import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	ScrollView,
	TouchableOpacity,
	Alert,
} from 'react-native';
import cachedBusService from '../services/cachedBusService';
import favoritesService from '../services/favoritesService';

const MapScreen = ({ route, navigation }) => {
	const [buses, setBuses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [favoriteStates, setFavoriteStates] = useState({});
	const specificBus = route?.params?.bus;

	useEffect(() => {
		loadBuses();
	}, []);

	useEffect(() => {
		if (buses.length > 0) {
			loadFavoriteStates();
		}
	}, [buses]);

	const loadFavoriteStates = async () => {
		try {
			const states = {};
			for (const bus of buses) {
				const isFav = await favoritesService.isFavorite(bus.lineNumber, bus.destination);
				states[`${bus.lineNumber}-${bus.destination}`] = isFav;
			}
			setFavoriteStates(states);
		} catch (error) {
			console.error('Error loading favorite states:', error);
		}
	};

	const loadBuses = async () => {
		try {
			const data = await cachedBusService.getLiveBuses();
			setBuses(data);
			setLoading(false);
		} catch (error) {
			console.error('Error loading buses for map:', error);
			setLoading(false);
		}
	};

	const handleBusPress = (bus) => {
		navigation.navigate('LineDetails', { bus });
	};

	const handleFavoritePress = async (bus) => {
		const key = `${bus.lineNumber}-${bus.destination}`;
		const currentFavorite = favoriteStates[key];
		
		try {
			if (currentFavorite) {
				await favoritesService.removeFavorite(bus.lineNumber, bus.destination);
				setFavoriteStates(prev => ({ ...prev, [key]: false }));
			} else {
				await favoritesService.addFavorite(bus);
				setFavoriteStates(prev => ({ ...prev, [key]: true }));
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
			Alert.alert('Error', 'Failed to update favorite status');
		}
	};

	if (specificBus) {
		// Show specific bus location
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Live Bus Location</Text>
				<View style={styles.mapContainer}>
					<Text style={styles.mapPlaceholder}>
						🗺️ Interactive map would be displayed here
					</Text>
					<View style={styles.busDetails}>
						<Text style={styles.busInfo}>Line: {specificBus.lineNumber}</Text>
						<Text style={styles.busInfo}>Destination: {specificBus.destination}</Text>
						<Text style={styles.busInfo}>Status: {specificBus.status}</Text>
						<Text style={styles.busInfo}>Location: Live tracking</Text>
					</View>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Live Bus Map</Text>
			<View style={styles.mapContainer}>
				<Text style={styles.mapPlaceholder}>
					🗺️ Interactive map with all live buses would be displayed here
				</Text>
				
				<Text style={styles.sectionTitle}>Live Buses on Map:</Text>
				<ScrollView style={styles.busList}>
					{buses.map((bus) => {
						const key = `${bus.lineNumber}-${bus.destination}`;
						const isFavorite = favoriteStates[key] || false;
						
						return (
							<TouchableOpacity
								key={bus.id}
								style={styles.busItem}
								onPress={() => handleBusPress(bus)}
							>
								<View style={styles.busIcon}>
									<Text style={styles.busIconText}>{bus.lineNumber}</Text>
								</View>
								<View style={styles.busItemInfo}>
									<Text style={styles.busItemDestination}>{bus.destination}</Text>
									<Text style={styles.busItemStatus}>{bus.status} • {bus.nextStop}</Text>
								</View>
								<TouchableOpacity 
									style={styles.favoriteButton} 
									onPress={() => handleFavoritePress(bus)}
								>
									<Text style={styles.favoriteButtonText}>{isFavorite ? '⭐' : '☆'}</Text>
								</TouchableOpacity>
							</TouchableOpacity>
						);
					})}
				</ScrollView>
			</View>
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
	mapContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#e0f7fa',
		margin: 20,
		borderRadius: 10,
		padding: 20,
	},
	mapPlaceholder: {
		fontSize: 16,
		color: '#666',
		marginBottom: 20,
		textAlign: 'center',
	},
	busDetails: {
		backgroundColor: '#fff',
		padding: 15,
		borderRadius: 8,
		width: '100%',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	busInfo: {
		fontSize: 16,
		marginVertical: 5,
		color: '#333',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
		alignSelf: 'flex-start',
	},
	busList: {
		width: '100%',
		maxHeight: 250,
	},
	busItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		padding: 10,
		marginBottom: 6,
		borderRadius: 6,
		elevation: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 1,
	},
	busIcon: {
		width: 35,
		height: 35,
		borderRadius: 17,
		backgroundColor: '#0066cc',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
	},
	busIconText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 11,
	},
	busItemInfo: {
		flex: 1,
	},
	busItemDestination: {
		fontSize: 13,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 2,
	},
	busItemStatus: {
		fontSize: 11,
		color: '#666',
	},
	favoriteButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 20,
		backgroundColor: '#f8f9fa',
		marginLeft: 8,
	},
	favoriteButtonText: {
		fontSize: 18,
		color: '#ffc107',
	},
});

export default MapScreen;
