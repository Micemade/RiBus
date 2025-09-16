import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import RideAccordion from './RideAccordion';

const RidesList = ({ rides, direction }) => {
	const [expandedRide, setExpandedRide] = useState(null);

	const handleToggle = (rideId) => {
		setExpandedRide(expandedRide === rideId ? null : rideId);
	};

	const formatDirection = (dir) => {
		if (!dir) return '';
		// Ensure dir is a string
		const dirStr = typeof dir === 'string' ? dir : String(dir);
		return dirStr.charAt(0).toUpperCase() + dirStr.slice(1);
	};

	if (!rides || rides.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>No scheduled trips available</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{direction && (
				<View style={styles.directionHeader}>
					<Text style={styles.directionText}>
						{formatDirection(direction)}
					</Text>
					<Text style={styles.ridesCount}>
						{rides.length} scheduled trip{rides.length !== 1 ? 's' : ''}
					</Text>
				</View>
			)}
			
			<ScrollView 
				style={styles.scrollContainer}
				showsVerticalScrollIndicator={false}
			>
				{rides.map((ride, index) => (
					<RideAccordion
						key={ride.rideId || `ride-${index}`}
						ride={ride}
						expanded={expandedRide === ride.rideId}
						onToggle={() => handleToggle(ride.rideId)}
					/>
				))}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	scrollContainer: {
		flex: 1,
		paddingVertical: 8,
	},
	directionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#fff',
		borderBottomWidth: 1,
		borderBottomColor: '#e9ecef',
	},
	directionText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	ridesCount: {
		fontSize: 14,
		color: '#666',
		backgroundColor: '#f8f9fa',
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 12,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32,
	},
	emptyText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
	},
});

export default RidesList;
