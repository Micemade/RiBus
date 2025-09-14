import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = ({ title }) => {
	return (
		<View style={styles.header}>
			<Text style={styles.title}>{title}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		backgroundColor: '#0066cc',
		padding: 15,
		alignItems: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: 'white',
	},
});

export default Header;
