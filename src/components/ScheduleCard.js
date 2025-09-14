import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScheduleCard = ({ schedule }) => {
	return (
		<View style={styles.card}>
			<Text style={styles.time}>{schedule.time}</Text>
			<Text style={styles.stop}>{schedule.stop}</Text>
			<Text style={styles.description}>{schedule.description}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#f8f9fa',
		padding: 15,
		marginVertical: 5,
		marginHorizontal: 10,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	time: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0066cc',
		width: 60,
	},
	stop: {
		fontSize: 14,
		fontWeight: 'bold',
		flex: 1,
	},
	description: {
		fontSize: 12,
		color: '#666',
		textAlign: 'right',
		width: 80,
	},
});

export default ScheduleCard;
