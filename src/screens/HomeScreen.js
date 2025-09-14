import React, { useState, useEffect, useRef } from 'react';
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
import cachedBusService from '../services/cachedBusService';

const HomeScreen = ({ navigation }) => {
	const [buses, setBuses] = useState([]);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const flatListRef = useRef(null);

	useEffect(() => {
		loadBuses();
	}, []);

	// Add scroll restoration effect
	useEffect(() => {
		if (buses.length > 0) {
			const selectedItemId = navigation.getSelectedItemId();
			if (selectedItemId && flatListRef.current) {
				setTimeout(() => {
					const itemIndex = buses.findIndex(bus => bus.id === selectedItemId);
					if (itemIndex >= 0) {
						console.log('HomeScreen: Scrolling to item at index', itemIndex);
						flatListRef.current.scrollToIndex({
							index: itemIndex,
							animated: true,
							viewPosition: 0.5
						});
					}
				}, 100);
			}
		}
	}, [buses]);

	const loadBuses = async () => {
		try {
			const data = await cachedBusService.getLiveBuses();
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
		navigation.navigate('LineDetails', {
			bus,
			selectedItemId: bus.id
		});
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
							ref={flatListRef}
							data={buses}
							renderItem={renderBus}
							keyExtractor={(item) => item.id.toString()}
							showsVerticalScrollIndicator={false}
							onScrollToIndexFailed={(info) => {
								console.log('HomeScreen: Scroll to index failed:', info);
								flatListRef.current?.scrollToOffset({
									offset: info.averageItemLength * info.index,
									animated: true,
								});
							}}
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
