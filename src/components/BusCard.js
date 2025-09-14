import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import favoritesService from '../services/favoritesService';

const BusCard = ({ bus, onPress }) => {
	const [isFavorite, setIsFavorite] = useState(false);

	useEffect(() => {
		checkFavoriteStatus();
	}, [bus.lineNumber, bus.destination]);

	const checkFavoriteStatus = async () => {
		try {
			const favorite = await favoritesService.isFavorite(bus.lineNumber, bus.destination);
			setIsFavorite(favorite);
		} catch (error) {
			console.error('Error checking favorite status:', error);
		}
	};

	const handleFavoritePress = async () => {
		try {
			if (isFavorite) {
				await favoritesService.removeFavorite(bus.lineNumber, bus.destination);
				setIsFavorite(false);
			} else {
				await favoritesService.addFavorite(bus);
				setIsFavorite(true);
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
			Alert.alert('Error', 'Failed to update favorite status');
		}
	};

	return (
		<TouchableOpacity style={styles.card} onPress={() => onPress(bus)}>
			<View style={styles.busIcon}>
				<Text style={styles.busIconText}>{bus.lineNumber}</Text>
				{bus.directionName && (
					<Text style={styles.busDirectionText}>
						{bus.direction === 0 ? '→' : '←'}
					</Text>
				)}
			</View>
			<View style={styles.busItemInfo}>
				<Text style={styles.busItemDestination}>{bus.destination}</Text>
				<Text style={styles.busItemRoute}>{bus.route}</Text>
				{bus.directionName && (
					<Text style={styles.busItemDirection}>Direction: {bus.directionName}</Text>
				)}
				<Text style={styles.busItemStatus}>{bus.status} • {bus.nextStop}</Text>
				<Text style={styles.busItemTime}>Arrival: {bus.arrivalTime}</Text>
			</View>
			<TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress}>
				<Text style={styles.favoriteButtonText}>{isFavorite ? '⭐' : '☆'}</Text>
			</TouchableOpacity>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	card: {
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
	busIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#0066cc',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		position: 'relative',
	},
	busIconText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 12,
	},
	busDirectionText: {
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
	busItemInfo: {
		flex: 1,
	},
	busItemDestination: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 2,
	},
	busItemRoute: {
		fontSize: 12,
		color: '#666',
		marginBottom: 2,
	},
	busItemDirection: {
		fontSize: 11,
		color: '#0066cc',
		fontWeight: '500',
		marginBottom: 2,
	},
	busItemStatus: {
		fontSize: 11,
		color: '#666',
		marginBottom: 2,
	},
	busItemTime: {
		fontSize: 11,
		color: '#0066cc',
		fontWeight: 'bold',
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

export default BusCard;
