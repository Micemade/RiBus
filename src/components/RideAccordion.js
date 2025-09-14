import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RideAccordion = ({ ride, expanded, onToggle }) => {
	console.log('RideAccordion: Rendering ride:', ride?.rideId, 'expanded:', expanded);
	
	if (!ride) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>Invalid ride data</Text>
			</View>
		);
	}

	const formatTime = (time) => {
		if (!time || time === 'N/A') return 'N/A';
		return time;
	};

	const getStartTime = () => {
		if (ride.firstDeparture && ride.firstDeparture !== 'N/A') {
			return ride.firstDeparture;
		}
		if (ride.departures && ride.departures.length > 0) {
			const firstDep = ride.departures[0];
			return formatTime(firstDep.time);
		}
		return 'N/A';
	};

	const getStopCount = () => {
		if (ride.stationCount) return ride.stationCount;
		if (ride.departures) return ride.departures.length;
		if (ride.departureCount) return ride.departureCount;
		return 0;
	};

	const getDestination = () => {
		if (ride.departures && ride.departures.length > 0) {
			const lastDep = ride.departures[ride.departures.length - 1];
			return lastDep.stop || 'Unknown';
		}
		return 'Unknown';
	};

	const startTime = getStartTime();
	const stopCount = getStopCount();
	const destination = getDestination();

	return (
		<View style={styles.container}>
			<TouchableOpacity 
				style={[styles.header, expanded && styles.headerExpanded]}
				onPress={onToggle}
			>
				<View style={styles.headerLeft}>
					<Text style={styles.startTime}>{startTime}</Text>
					<Text style={styles.subtitle}>
						{stopCount} stops → {destination}
					</Text>
				</View>
				<View style={styles.headerRight}>
					<Text style={[styles.expandIcon, expanded && styles.expandIconRotated]}>
						▼
					</Text>
				</View>
			</TouchableOpacity>

			{expanded && (
				<View style={styles.content}>
					{ride.departures && ride.departures.length > 0 ? (
						ride.departures.map((departure, index) => (
							<View key={departure.id || index} style={styles.departureItem}>
								<Text style={styles.departureTime}>
									{formatTime(departure.time)}
								</Text>
								<Text style={styles.departureStop}>
									{departure.stop || 'Unknown Stop'}
								</Text>
								{departure.arrival && departure.arrival !== departure.time && (
									<Text style={styles.arrivalTime}>
										→ {formatTime(departure.arrival)}
									</Text>
								)}
							</View>
						))
					) : (
						<View style={styles.noDataContainer}>
							<Text style={styles.noDataText}>No schedule data available</Text>
						</View>
					)}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'white',
		marginBottom: 8,
		borderRadius: 8,
		overflow: 'hidden',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.22,
		shadowRadius: 2.22,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#f8f9fa',
	},
	headerExpanded: {
		backgroundColor: '#e3f2fd',
	},
	headerLeft: {
		flex: 1,
	},
	headerRight: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	startTime: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0066cc',
	},
	subtitle: {
		fontSize: 14,
		color: '#666',
		marginTop: 2,
	},
	expandIcon: {
		fontSize: 16,
		color: '#666',
		transform: [{ rotate: '-90deg' }],
	},
	expandIconRotated: {
		transform: [{ rotate: '0deg' }],
	},
	content: {
		backgroundColor: 'white',
	},
	departureItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	departureTime: {
		fontSize: 14,
		fontWeight: '600',
		color: '#0066cc',
		width: 60,
	},
	departureStop: {
		fontSize: 14,
		color: '#333',
		flex: 1,
		marginLeft: 12,
	},
	arrivalTime: {
		fontSize: 12,
		color: '#666',
		marginLeft: 8,
	},
	noDataContainer: {
		padding: 20,
		alignItems: 'center',
	},
	noDataText: {
		fontSize: 14,
		color: '#666',
		fontStyle: 'italic',
	},
	errorContainer: {
		backgroundColor: '#ffebee',
		padding: 16,
		marginBottom: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#ef5350',
	},
	errorText: {
		color: '#c62828',
		fontSize: 14,
		textAlign: 'center',
	},
});

export default RideAccordion;
