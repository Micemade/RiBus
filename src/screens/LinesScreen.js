import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from 'react-native';
import cachedBusService from '../services/cachedBusService';
import favoritesService from '../services/favoritesService';
import { StarIcon } from '../components/Icons';

const LinesScreen = ({ navigation }) => {
	const [lines, setLines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [favoriteStates, setFavoriteStates] = useState({});
	const flatListRef = useRef(null);

	useEffect(() => {
		loadLines();
	}, []);

	useEffect(() => {
		if (lines.length > 0) {
			loadFavoriteStates();

			// Check if we need to scroll to a specific item (when returning from details)
			const selectedItemId = navigation.getSelectedItemId();
			if (selectedItemId && flatListRef.current) {
				setTimeout(() => {
					const itemIndex = lines.findIndex(line => line.id === selectedItemId);
					if (itemIndex >= 0) {
						flatListRef.current.scrollToIndex({
							index: itemIndex,
							animated: true,
							viewPosition: 0.5 // Center the item
						});
					}
				}, 100); // Small delay to ensure the list is rendered
			}
		}
	}, [lines]);

	const loadFavoriteStates = async () => {
		try {
			const states = {};
			for (const line of lines) {
				const isFav = await favoritesService.isFavorite(line.lineNumber, line.destination);
				states[`${line.lineNumber}-${line.destination}`] = isFav;
			}
			setFavoriteStates(states);
		} catch (error) {
			console.error('Error loading favorite states:', error);
		}
	};

	const loadLines = async () => {
		try {
			// Get live buses to extract line information
			const liveBuses = await cachedBusService.getLiveBuses();
			
			// Extract unique lines from live buses
			const uniqueLines = [];
			const seenLines = new Set();
			
			liveBuses.forEach(bus => {
				const lineKey = `${bus.lineNumber}-${bus.destination}`;
				if (!seenLines.has(lineKey)) {
					seenLines.add(lineKey);
					uniqueLines.push({
						id: bus.id,
						lineNumber: bus.lineNumber,
						destination: bus.destination,
						route: bus.route || 'City Route',
						status: 'Active',
						nextStop: bus.nextStop || 'Various stops',
					});
				}
			});
			
			// Sort lines by line number
			uniqueLines.sort((a, b) => {
				const aNum = parseInt(a.lineNumber) || 999;
				const bNum = parseInt(b.lineNumber) || 999;
				return aNum - bNum;
			});
			
			setLines(uniqueLines);
			setLoading(false);
		} catch (error) {
			console.error('Error loading lines:', error);
			setLoading(false);
		}
	};

	const handleLinePress = (line) => {
		navigation.navigate('LineDetails', {
			bus: line,
			selectedItemId: line.id
		});
	};

	const handleFavoritePress = async (line) => {
		const key = `${line.lineNumber}-${line.destination}`;
		const currentFavorite = favoriteStates[key];
		
		try {
			if (currentFavorite) {
				await favoritesService.removeFavorite(line.lineNumber, line.destination);
				setFavoriteStates(prev => ({ ...prev, [key]: false }));
			} else {
				await favoritesService.addFavorite(line);
				setFavoriteStates(prev => ({ ...prev, [key]: true }));
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
			Alert.alert('Error', 'Failed to update favorite status');
		}
	};

	const renderLine = ({ item }) => {
		const key = `${item.lineNumber}-${item.destination}`;
		const isFavorite = favoriteStates[key] || false;
		
		return (
			<TouchableOpacity style={styles.lineItem} onPress={() => handleLinePress(item)}>
				<View style={styles.lineIcon}>
					<Text style={styles.lineIconText}>{item.lineNumber}</Text>
					{item.directionName && (
						<Text style={styles.lineDirectionText}>
							{item.direction === 0 ? '→' : '←'}
						</Text>
					)}
				</View>
				<View style={styles.lineItemInfo}>
					<Text style={styles.lineItemDestination}>{item.destination}</Text>
					<Text style={styles.lineItemRoute}>{item.route}</Text>
					{item.directionName && (
						<Text style={styles.lineItemDirection}>Direction: {item.directionName}</Text>
					)}
					<Text style={styles.lineItemStatus}>{item.status} • Tap to view schedule</Text>
				</View>
				<TouchableOpacity 
					style={styles.favoriteButton} 
					onPress={() => handleFavoritePress(item)}
				>
					<Text style={styles.favoriteButtonText}><StarIcon size={22} color={isFavorite ? "#ffc107" : "#666"} /></Text>
				</TouchableOpacity>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#0066cc" />
				<Text style={styles.loadingText}>Loading bus lines...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.subtitle}>
				{lines.length} active bus lines
			</Text>
			<FlatList
				ref={flatListRef}
				data={lines}
				renderItem={renderLine}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
				showsVerticalScrollIndicator={false}
				onScrollToIndexFailed={(info) => {
					// Fallback: scroll to offset
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
	subtitle: {
		fontSize: 12,
		color: '#666',
		margin: 10,
		textAlign: 'center',
	},
	listContainer: {
		padding: 10,
	},
	lineItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		padding: 12,
		marginVertical: 4,
		marginHorizontal: 10,
		borderRadius: 8,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	lineIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#0066cc', 
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		position: 'relative',
	},
	lineIconText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 12,
	},
	lineDirectionText: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		backgroundColor: '#fff',
		color: '#0066cc',
		fontSize: 10,
		width: 16,
		height: 16,
		borderRadius: 8,
		textAlign: 'center',
		lineHeight: 16,
		fontWeight: 'bold',
	},
	lineItemInfo: {
		flex: 1,
	},
	lineItemDestination: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 2,
	},
	lineItemRoute: {
		fontSize: 12,
		color: '#666',
		marginBottom: 2,
	},
	lineItemDirection: {
		fontSize: 11,
		color: '#0066cc',
		fontWeight: '500',
		marginBottom: 2,
	},
	lineItemStatus: {
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

export default LinesScreen;
