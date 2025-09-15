import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
} from 'react-native';
import cachedBusService from '../services/cachedBusService';
import favoritesService from '../services/favoritesService';

const MyLinesScreen = ({ navigation }) => {
	const [savedLines, setSavedLines] = useState([]);
	const [liveSchedules, setLiveSchedules] = useState({});
	const [loading, setLoading] = useState(true);
	const flatListRef = useRef(null);

	useEffect(() => {
		loadSavedLines();
	}, []);

	// Add scroll restoration effect.
	useEffect(() => {
		if (savedLines.length > 0) {
			const selectedItemId = navigation.getSelectedItemId();
			if (selectedItemId && flatListRef.current) {
				setTimeout(() => {
					const itemIndex = savedLines.findIndex(line =>
						`${line.lineNumber}-${line.destination}` === selectedItemId
					);
					if (itemIndex >= 0) {
						console.log('MyLinesScreen: Scrolling to item at index:', itemIndex);
						flatListRef.current.scrollToIndex({
							index: itemIndex,
							animated: true,
							viewPosition: 0.5
						});
					}
				}, 100);
			}
		}
	}, [savedLines]);

	const loadSavedLines = async () => {
		try {
			// Load saved lines from persistent storage
			const favorites = await favoritesService.getFavorites();
			
			setSavedLines(favorites);
			
			// Load live schedules for each saved line
			await loadLiveSchedules(favorites);
			
			setLoading(false);
		} catch (error) {
			console.error('Error loading saved lines:', error);
			setLoading(false);
		}
	};

	const loadLiveSchedules = async (lines) => {
		console.log('MyLinesScreen: Loading live schedules for', lines.length, 'lines');
		const schedules = {};
		
		for (const line of lines) {
			try {
				console.log('MyLinesScreen: Fetching schedule for line:', line.lineNumber);
				const schedule = await cachedBusService.getBusSchedule(line.lineNumber);
				console.log('MyLinesScreen: Received schedule for line', line.lineNumber, ':', schedule.length, 'entries');
				console.log('MyLinesScreen: Sample schedule data:', schedule.slice(0, 2));
				// Get next 3 departures
				schedules[line.lineNumber] = schedule.slice(0, 3);
			} catch (error) {
				console.error(`Error loading schedule for line ${line.lineNumber}:`, error);
				schedules[line.lineNumber] = [];
			}
		}
		
		console.log('MyLinesScreen: Final schedules object:', schedules);
		setLiveSchedules(schedules);
	};

	const handleLinePress = (line) => {
		navigation.navigate('LineDetails', {
			bus: line,
			selectedItemId: `${line.lineNumber}-${line.destination}`
		});
	};

	const handleRemoveLine = (lineNumber, destination) => {
		console.log('MyLinesScreen: handleRemoveLine called with:', lineNumber, destination);
		console.log('MyLinesScreen: Current favorites count:', favorites.length);
		
		Alert.alert(
			'Remove Line',
			`Remove line ${lineNumber} to ${destination} from your favorites?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						console.log('MyLinesScreen: User confirmed removal, calling removeFavorite...');
						try {
							const updatedFavorites = await favoritesService.removeFavorite(lineNumber, destination);
							console.log('MyLinesScreen: removeFavorite successful, updating state with:', updatedFavorites);
							setFavorites(updatedFavorites);
							console.log('MyLinesScreen: State updated successfully');
						} catch (error) {
							console.error('MyLinesScreen: Error removing favorite:', error);
							Alert.alert('Error', 'Failed to remove line from favorites');
						}
					}
				}
			]
		);
	};	const handleRefresh = () => {
		setLoading(true);
		loadSavedLines();
	};

	const renderScheduleItem = (item) => (
		<View style={styles.scheduleItem}>
			<Text style={styles.scheduleTime}>{item.time}</Text>
			<Text style={styles.scheduleStop} numberOfLines={1}>{item.stop}</Text>
		</View>
	);

	const renderLine = ({ item }) => {
		const schedule = liveSchedules[item.lineNumber] || [];
		console.log('MyLinesScreen: Rendering line', item.lineNumber, 'with schedule length:', schedule.length);
		console.log('MyLinesScreen: Schedule data for', item.lineNumber, ':', schedule);
		
		return (
			<View style={styles.lineCard}>
				<View style={styles.lineHeader}>
					<TouchableOpacity 
						style={styles.lineInfo}
						onPress={() => handleLinePress(item)}
					>
						<View style={styles.lineNumberContainer}>
							<Text style={styles.lineNumber}>{item.lineNumber}</Text>
							{item.directionName && (
								<Text style={styles.lineDirection}>
									{item.direction === 0 ? '→' : '←'}
								</Text>
							)}
						</View>
						<Text style={styles.lineDestination}>{item.destination}</Text>
						{item.directionName && (
							<Text style={styles.lineDirectionName}>Direction: {item.directionName}</Text>
						)}
					</TouchableOpacity>
					<TouchableOpacity 
						style={styles.removeButton}
						onPress={() => handleRemoveLine(item.lineNumber, item.destination)}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Text style={styles.removeButtonText}>×</Text>
					</TouchableOpacity>
				</View>
				
				<View style={styles.scheduleContainer}>
					<Text style={styles.scheduleTitle}>Next departures:</Text>
					{schedule.length > 0 ? (
						<View style={styles.scheduleList}>
							{schedule.map((scheduleItem, index) => (
								<View key={index} style={styles.scheduleItem}>
									<Text style={styles.scheduleTime}>{scheduleItem.time}</Text>
									<Text style={styles.scheduleStop} numberOfLines={1}>
										{scheduleItem.stop}
									</Text>
								</View>
							))}
						</View>
					) : (
						<Text style={styles.noSchedule}>No schedule available</Text>
					)}
				</View>
				
				<TouchableOpacity 
					style={styles.viewFullButton}
					onPress={() => handleLinePress(item)}
				>
					<Text style={styles.viewFullButtonText}>View Full Schedule</Text>
				</TouchableOpacity>
			</View>
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#0066cc" />
				<Text style={styles.loadingText}>Loading your lines...</Text>
			</View>
		);
	}

	if (savedLines.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>No saved lines yet</Text>
				<Text style={styles.emptySubtext}>
					Go to "Lines" tab to browse and save your favorite bus lines
				</Text>
				<TouchableOpacity 
					style={styles.browseButton}
					onPress={() => navigation.navigate('Lines')}
				>
					<Text style={styles.browseButtonText}>Browse Lines</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.headerActions}>
				<Text style={styles.subtitle}>
					{savedLines.length} saved line{savedLines.length !== 1 ? 's' : ''}
				</Text>
				<TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
					<Text style={styles.refreshButtonText}>🔄 Refresh</Text>
				</TouchableOpacity>
			</View>
			
			<FlatList
				ref={flatListRef}
				data={savedLines}
				renderItem={renderLine}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
				showsVerticalScrollIndicator={false}
				onScrollToIndexFailed={(info) => {
					console.log('MyLinesScreen: Scroll to index failed:', info);
					flatListRef.current?.scrollToOffset({
						offset: info.averageItemLength * info.index,
						animated: true,
					});
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: '#666',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#666',
		marginBottom: 10,
	},
	emptySubtext: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		marginBottom: 20,
	},
	browseButton: {
		backgroundColor: '#0066cc',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	browseButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	headerActions: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		margin: 15,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
	},
	refreshButton: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	refreshButtonText: {
		fontSize: 12,
		color: '#666',
	},
	listContainer: {
		padding: 10,
	},
	lineCard: {
		backgroundColor: '#fff',
		marginVertical: 5,
		marginHorizontal: 10,
		borderRadius: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	lineHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 15,
		paddingBottom: 10,
	},
	lineInfo: {
		flex: 1,
		paddingRight: 8,
	},
	lineNumberContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	lineNumber: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#0066cc',
	},
	lineDirection: {
		fontSize: 14,
		color: '#0066cc',
		marginLeft: 8,
		backgroundColor: '#e3f2fd',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 10,
		fontWeight: 'bold',
		minWidth: 24,
		textAlign: 'center',
	},
	lineDestination: {
		fontSize: 14,
		color: '#666',
		marginTop: 2,
	},
	lineDirectionName: {
		fontSize: 12,
		color: '#0066cc',
		marginTop: 2,
		fontWeight: '500',
	},
	removeButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#ffebee',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 12,
		borderWidth: 1,
		borderColor: '#ffcdd2',
	},
	removeButtonText: {
		fontSize: 18,
		color: '#f44336',
		fontWeight: 'bold',
		lineHeight: 18,
	},
	scheduleContainer: {
		paddingHorizontal: 15,
		paddingBottom: 10,
	},
	scheduleTitle: {
		fontSize: 12,
		color: '#666',
		fontWeight: 'bold',
		marginBottom: 5,
	},
	scheduleList: {
		backgroundColor: '#f8f9fa',
		borderRadius: 6,
		padding: 8,
	},
	scheduleItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 2,
	},
	scheduleTime: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#0066cc',
		width: 50,
	},
	scheduleStop: {
		fontSize: 11,
		color: '#666',
		flex: 1,
		marginLeft: 10,
	},
	noSchedule: {
		fontSize: 12,
		color: '#999',
		fontStyle: 'italic',
		textAlign: 'center',
		padding: 10,
	},
	viewFullButton: {
		borderTopWidth: 1,
		borderTopColor: '#f0f0f0',
		paddingVertical: 12,
		alignItems: 'center',
	},
	viewFullButtonText: {
		fontSize: 12,
		color: '#0066cc',
		fontWeight: 'bold',
	},
});

export default MyLinesScreen;
