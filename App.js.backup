import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ListIcon, StarIcon, BusIcon, MapIcon, ArrowLeftIcon } from './src/components/Icons';
import HomeScreen from './src/screens/HomeScreen';
import LineDetailsScreen from './src/screens/LineDetailsScreen';
import MapScreen from './src/screens/MapScreen';
import LinesScreen from './src/screens/LinesScreen';
import MyLinesScreen from './src/screens/MyLinesScreen';

export default function App() {
	const [currentScreen, setCurrentScreen] = useState('Lines');
	const [selectedBus, setSelectedBus] = useState(null);

	const navigation = {
		navigate: (screen, params) => {
			setCurrentScreen(screen);
			if (params?.bus) {
				setSelectedBus(params.bus);
			}
		},
		goBack: () => {
			// Navigate back to the appropriate main screen
			if (currentScreen === 'LineDetails') {
				// Determine which main screen to go back to based on previous context
				// For simplicity, we'll go back to Home, but this could be improved
				setCurrentScreen('Home');
				setSelectedBus(null);
			}
		}
	};

	const renderScreen = () => {
		switch (currentScreen) {
			case 'Home':
				return <HomeScreen navigation={navigation} />;
			case 'Lines':
				return <LinesScreen navigation={navigation} />;
			case 'Map':
				return <MapScreen route={{ params: { bus: selectedBus } }} navigation={navigation} />;
			case 'MyLines':
				return <MyLinesScreen navigation={navigation} />;
			case 'LineDetails':
				return <LineDetailsScreen route={{ params: { bus: selectedBus } }} navigation={navigation} />;
			default:
				return <HomeScreen navigation={navigation} />;
		}
	};

	const getHeaderTitle = () => {
		switch (currentScreen) {
			case 'Home': return 'Live Buses';
			case 'Lines': return 'All Lines';
			case 'Map': return 'Live Bus Map';
			case 'MyLines': return 'My Lines';
			case 'LineDetails': return 'Bus Line Details';
			default: return 'City Bus Schedule';
		}
	};

	const isBottomNavScreen = ['Home', 'Lines', 'Map', 'MyLines'].includes(currentScreen);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				{!isBottomNavScreen && (
					<TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
						<Text style={styles.backButtonText}>← Back</Text>
					</TouchableOpacity>
				)}
				<Text style={styles.headerTitle}>
					{getHeaderTitle()}
				</Text>
			</View>
			
			{/* Content Area */}
			<View style={[styles.content, isBottomNavScreen && styles.contentWithNav]}>
				{renderScreen()}
			</View>

			{/* Bottom Navigation - Fixed position */}
			{isBottomNavScreen && (
				<View style={styles.bottomNav}>
					<TouchableOpacity 
						style={[styles.navItem, currentScreen === 'Lines' && styles.navItemActive]}
						onPress={() => setCurrentScreen('Lines')}
					>
						<ListIcon
							size={22}
							color={currentScreen === 'Lines' ? '#0066cc' : '#666'}
						/>
						<Text style={[styles.navText, currentScreen === 'Lines' && styles.navTextActive]}>
							Lines
						</Text>
					</TouchableOpacity>
					
					<TouchableOpacity 
						style={[styles.navItem, currentScreen === 'MyLines' && styles.navItemActive]}
						onPress={() => setCurrentScreen('MyLines')}
					>
						<StarIcon
							size={22}
							color={currentScreen === 'MyLines' ? '#0066cc' : '#666'}
						/>
						<Text style={[styles.navText, currentScreen === 'MyLines' && styles.navTextActive]}>
							My Lines
						</Text>
					</TouchableOpacity>
					
					<TouchableOpacity 
						style={[styles.navItem, currentScreen === 'Home' && styles.navItemActive]}
						onPress={() => setCurrentScreen('Home')}
					>
						<BusIcon
							size={22}
							color={currentScreen === 'Home' ? '#0066cc' : '#666'}
						/>
						<Text style={[styles.navText, currentScreen === 'Home' && styles.navTextActive]}>
							Live
						</Text>
					</TouchableOpacity>
					
					<TouchableOpacity 
						style={[styles.navItem, currentScreen === 'Map' && styles.navItemActive]}
						onPress={() => setCurrentScreen('Map')}
					>
						<MapIcon
							size={22}
							color={currentScreen === 'Map' ? '#0066cc' : '#666'}
						/>
						<Text style={[styles.navText, currentScreen === 'Map' && styles.navTextActive]}>
							Map
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		height: '100vh',
	},
	header: {
		backgroundColor: '#0066cc',
		paddingTop: 20,
		paddingBottom: 15,
		paddingHorizontal: 15,
		flexDirection: 'row',
		alignItems: 'center',
		zIndex: 10,
	},
	backButton: {
		marginRight: 15,
	},
	backButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	headerTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
		flex: 1,
	},
	content: {
		flex: 1,
	},
	contentWithNav: {
		paddingBottom: 80, // Space for the fixed bottom navigation
	},
	bottomNav: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0',
		paddingVertical: 10,
		paddingHorizontal: 10,
		paddingBottom: 12, // Safe area padding
		elevation: 20, // Maximum elevation for Android
		zIndex: 9999, // Maximum z-index
		shadowColor: '#000',
		shadowOffset: { width:5, height: 0 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
	},
	navItem: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 6,
		paddingHorizontal: 4,
		borderRadius: 8,
		marginHorizontal: 2,
	},
	navItemActive: {
		backgroundColor: '#e3f2fd',
	},
	navText: {
		fontSize: 11,
		color: '#666',
		textAlign: 'center',
		fontWeight: '500',
		marginTop: 4,
	},
	navTextActive: {
		color: '#0066cc',
		fontWeight: 'bold',
	},
});
