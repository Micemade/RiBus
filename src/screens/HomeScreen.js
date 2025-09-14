import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	RefreshControl,
	ScrollView,
} from 'react-native';
import SearchBar from '../components/SearchBar';
import BusCard from '../components/BusCard';
import busService from '../services/busService';

const HomeScreen = ({ navigation }) => {
	const [buses, setBuses] = useState([]);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		console.log('HomeScreen: useEffect triggered');
		loadBuses();
	}, []);

	const loadBuses = async () => {
		console.log('HomeScreen: loadBuses called');
		try {
			const data = await busService.getLiveBuses();
			console.log('HomeScreen: buses loaded', data);
			setBuses(data);
		} catch (error) {
			console.error('Error loading buses:', error);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadBuses();
		setRefreshing(false);
	};

	const handleSearch = (query) => {
		setSearchQuery(query);
		if (query.trim() === '') {
			loadBuses();
		} else {
			const filtered = buses.filter(bus =>
				bus.lineNumber.toLowerCase().includes(query.toLowerCase()) ||
				bus.destination.toLowerCase().includes(query.toLowerCase())
			);
			setBuses(filtered);
		}
	};

	const handleBusPress = (bus) => {
		navigation.navigate('LineDetails', { bus });
	};

	const renderBus = ({ item }) => (
		<BusCard bus={item} onPress={handleBusPress} />
	);

	return (
		<View style={styles.container}>
			<SearchBar onSearch={handleSearch} />

			<ScrollView
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Live Buses</Text>
					<Text style={styles.subtitle}>
						Real-time bus locations and schedules • Tap to view details
					</Text>
					{buses.length > 0 ? (
						<FlatList
							data={buses}
							renderItem={renderBus}
							keyExtractor={(item) => item.id.toString()}
							showsVerticalScrollIndicator={false}
						/>
					) : (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>Loading bus lines...</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		padding: 15,
		paddingBottom: 5,
		color: '#333',
	},
	subtitle: {
		fontSize: 14,
		color: '#666',
		paddingHorizontal: 15,
		paddingBottom: 10,
	},
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 50,
	},
	emptyText: {
		fontSize: 16,
		color: '#666',
	},
});

export default HomeScreen;
