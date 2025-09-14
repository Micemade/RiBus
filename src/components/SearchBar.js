import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';

const SearchBar = ({ onSearch }) => {
	const [searchQuery, setSearchQuery] = useState('');

	const handleSearch = () => {
		onSearch(searchQuery);
	};

	return (
		<View style={styles.container}>
			<TextInput
				style={styles.input}
				placeholder="Search bus line or destination..."
				value={searchQuery}
				onChangeText={setSearchQuery}
				onSubmitEditing={handleSearch}
			/>
			<TouchableOpacity style={styles.searchButton}
				onPress={handleSearch}>
				<Text
					style={styles.searchButtonText}>Search</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		padding: 10,
		backgroundColor: '#f0f0f0',
	},
	input: {
		flex: 1,
		height: 40,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 5,
		paddingHorizontal: 10,
		marginRight: 10,
	},
	searchButton: {
		backgroundColor: '#0066cc',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		justifyContent: 'center',
	},
	searchButtonText: {
		color: 'white',
		fontWeight: 'bold',
	},
});

export default SearchBar;
