import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getRideStatus, getStationStatus, getNextStation, getRideProgress } from '../utils/rideStatusUtils';

const RideAccordion = ({ ride, expanded, onToggle }) => {
	
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

	// Get ride status and next station info
	const rideStatus = getRideStatus(ride);
	const nextStation = getNextStation(ride);
	const progress = getRideProgress(ride);

	// Get status-based styling
	const getHeaderStyle = () => {
		switch (rideStatus) {
			case 'expired':
				return [styles.header, styles.headerExpired, expanded && styles.headerExpanded];
			case 'active':
				return [styles.header, styles.headerActive, expanded && styles.headerExpanded];
			case 'upcoming':
			default:
				return [styles.header, expanded && styles.headerExpanded];
		}
	};

	const getStatusBadge = () => {
		switch (rideStatus) {
			case 'expired':
				return <View style={[styles.statusBadge, styles.statusExpired]}><Text style={styles.statusText}>ENDED</Text></View>;
			case 'active':
				return <View style={[styles.statusBadge, styles.statusActive]}><Text style={styles.statusText}>LIVE</Text></View>;
			case 'upcoming':
				return <View style={[styles.statusBadge, styles.statusUpcoming]}><Text style={styles.statusText}>UPCOMING</Text></View>;
			default:
				return null;
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity 
				style={getHeaderStyle()}
				onPress={onToggle}
			>
				<View style={styles.headerLeft}>
					<View style={styles.headerTop}>
						<Text style={[styles.startTime, rideStatus === 'expired' && styles.expiredText]}>
							{startTime}
						</Text>
						{getStatusBadge()}
					</View>
					<Text style={[styles.subtitle, rideStatus === 'expired' && styles.expiredText]}>
						{stopCount} stops → {destination}
					</Text>
					{rideStatus === 'active' && nextStation && (
						<Text style={styles.nextStationText}>
							Next: {nextStation.stop} at {nextStation.time}
						</Text>
					)}
					{rideStatus === 'active' && (
						<View style={styles.progressContainer}>
							<View style={styles.progressBar}>
								<View style={[styles.progressFill, { width: `${progress}%` }]} />
							</View>
							<Text style={styles.progressText}>{progress}% complete</Text>
						</View>
					)}
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
						ride.departures.map((departure, index) => {
							const stationStatus = getStationStatus(departure, ride);

							return (
								<View key={departure.id || index} style={[
									styles.departureItem,
									stationStatus === 'current' && styles.currentStation,
									stationStatus === 'visited' && styles.visitedStation
								]}>
									<Text style={[
										styles.departureTime,
										stationStatus === 'visited' && styles.visitedText,
										stationStatus === 'current' && styles.currentText
									]}>
										{formatTime(departure.time)}
									</Text>
									<Text style={[
										styles.departureStop,
										stationStatus === 'visited' && styles.visitedText,
										stationStatus === 'current' && styles.currentText
									]}>
										{departure.stop || 'Unknown Stop'}
										{stationStatus === 'current' && ' 🚌'}
									</Text>
									{departure.arrival && departure.arrival !== departure.time && (
										<Text style={[
											styles.arrivalTime,
											stationStatus === 'visited' && styles.visitedText
										]}>
											→ {formatTime(departure.arrival)}
										</Text>
									)}
									{stationStatus === 'current' && (
										<View style={styles.currentIndicator} />
									)}
								</View>
							);
						})
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
	// Ride status-specific header styles
	headerExpired: {
		backgroundColor: '#f5f5f5',
		borderLeftWidth: 4,
		borderLeftColor: '#bdbdbd',
	},
	headerActive: {
		backgroundColor: '#e8f5e8',
		borderLeftWidth: 4,
		borderLeftColor: '#4caf50',
	},
	headerLeft: {
		flex: 1,
	},
	headerTop: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 4,
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
	// Status badges
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		marginLeft: 8,
	},
	statusExpired: {
		backgroundColor: '#bdbdbd',
	},
	statusActive: {
		backgroundColor: '#4caf50',
	},
	statusUpcoming: {
		backgroundColor: '#2196f3',
	},
	statusText: {
		fontSize: 10,
		fontWeight: 'bold',
		color: 'white',
	},
	// Next station info for active rides
	nextStationText: {
		fontSize: 13,
		color: '#4caf50',
		fontWeight: '800',
		marginTop: 4,
	},
	// Progress bar for active rides
	progressContainer: {
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	progressBar: {
		flex: 1,
		height: 4,
		backgroundColor: '#e0e0e0',
		borderRadius: 2,
		marginRight: 8,
	},
	progressFill: {
		height: '100%',
		backgroundColor: '#4caf50',
		borderRadius: 2,
	},
	progressText: {
		fontSize: 10,
		color: '#666',
		width: 70,
	},
	// Expired ride styling
	expiredText: {
		color: '#9e9e9e',
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
		position: 'relative',
	},
	// Station status-specific styles
	currentStation: {
		backgroundColor: '#e8f5e8',
		borderLeftWidth: 4,
		borderLeftColor: '#4caf50',
	},
	visitedStation: {
		backgroundColor: '#fafafa',
		opacity: 0.7,
	},
	currentIndicator: {
		position: 'absolute',
		right: 12,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#4caf50',
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
	// Text styling for different states
	visitedText: {
		color: '#9e9e9e',
	},
	currentText: {
		color: '#4caf50',
		fontWeight: 'bold',
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
