import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ListIcon, StarIcon, BusIcon, MapIcon, ArrowLeftIcon } from './src/components/Icons';
import PerformanceMonitor from './src/components/PerformanceMonitor';
import cachedBusService from './src/services/cachedBusService';
import HomeScreen from './src/screens/HomeScreen';
import LineDetailsScreen from './src/screens/LineDetailsScreen';
import MapScreen from './src/screens/MapScreen';
import LinesScreen from './src/screens/LinesScreen';
import MyLinesScreen from './src/screens/MyLinesScreen';

export default function App() {
	const [currentScreen, setCurrentScreen] = useState('Lines');
	const [selectedBus, setSelectedBus] = useState(null);
	const [navigationParams, setNavigationParams] = useState({}); // Store navigation parameters
	const [isInitializing, setIsInitializing] = useState(true);
	const [dataReady, setDataReady] = useState(false);
	const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

	// Navigation history and scroll position tracking
	const [navigationHistory, setNavigationHistory] = useState(['Lines']);
	const [scrollPositions, setScrollPositions] = useState({});
	const [selectedItemId, setSelectedItemId] = useState(null);

	// Initialize app and preload data
	useEffect(() => {
		initializeApp();
	}, []);

	const initializeApp = async () => {
		try {
			const startTime = Date.now();

			// Warmup cache with essential data
			await cachedBusService.warmupCache();

			const loadTime = Date.now() - startTime;

			setDataReady(true);
		} catch (error) {
			console.error('App: Initialization error:', error);
			setDataReady(true); // Continue without cache to prevent app blocking
		} finally {
			setIsInitializing(false);
		}
	};

	const navigation = {
		navigate: (screen, params) => {

			// Save scroll position for current screen before navigating
			if (params?.saveScrollPosition && params?.scrollPosition) {
				setScrollPositions(prev => ({
					...prev,
					[currentScreen]: params.scrollPosition
				}));
			}

			// Track navigation history
			if (screen !== currentScreen) {
				setNavigationHistory(prev => [...prev, screen]);
			}

			// Set selected item for scroll restoration
			if (params?.selectedItemId) {
				setSelectedItemId(params.selectedItemId);
			}

			setCurrentScreen(screen);

			// Store all navigation parameters
			setNavigationParams(params || {});

			// Keep backward compatibility for bus parameter
			if (params?.bus) {
				setSelectedBus(params.bus);
			} else {
				setSelectedBus(null); // Clear selectedBus if not provided
			}
		},
		goBack: () => {

			if (navigationHistory.length > 1) {
				// Remove current screen from history
				const newHistory = [...navigationHistory];
				newHistory.pop(); // Remove current screen
				const previousScreen = newHistory[newHistory.length - 1];

				setNavigationHistory(newHistory);
				setCurrentScreen(previousScreen);
				setSelectedBus(null);
				setNavigationParams({}); // Clear navigation parameters

				// The scroll restoration will be handled by the screen components
				// when they detect the selectedItemId
			} else {
			// Fallback to Lines screen if no history
				setCurrentScreen('Lines');
				setSelectedBus(null);
				setNavigationParams({}); // Clear navigation parameters
			}
		},
		getScrollPosition: (screen) => {
			return scrollPositions[screen] || null;
		},
		getSelectedItemId: () => {
			const itemId = selectedItemId;
			setSelectedItemId(null); // Clear after use
			return itemId;
		}
	};

	const renderScreen = () => {
		switch (currentScreen) {
			case 'Home':
				return <HomeScreen navigation={navigation} />;
			case 'Lines':
				return <LinesScreen navigation={navigation} />;
			case 'Map':
				return <MapScreen route={{ params: { bus: selectedBus, ...navigationParams } }} navigation={navigation} />;
			case 'MyLines':
				return <MyLinesScreen navigation={navigation} />;
			case 'LineDetails':
				return <LineDetailsScreen route={{ params: { bus: selectedBus, ...navigationParams } }} navigation={navigation} />;
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

	const isBottomNavScreen = ['Home', 'Lines', 'Map', 'MyLines', 'LineDetails'].includes(currentScreen);
	const showBackButton = currentScreen === 'LineDetails';

	// Show loading screen during initialization
	if (isInitializing) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#0066cc" />
				<Text style={styles.loadingText}>Loading RiBus...</Text>
				<Text style={styles.loadingSubtext}>Preparing your data for instant access</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				{(!isBottomNavScreen || showBackButton) && (
					<TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
						<ArrowLeftIcon color="#fff" size={18} />
						<Text style={styles.backButtonText}>Back</Text>
					</TouchableOpacity>
				)}
				<Text style={styles.headerTitle}>
					{getHeaderTitle()}
				</Text>

				{/* Performance Monitor Toggle - Debug only */}
				{__DEV__ && (
					<View style={styles.debugButtons}>
						<TouchableOpacity
							onPress={() => setShowPerformanceMonitor(true)}
							style={styles.debugButton}
						>
							<Text style={styles.debugButtonText}>⚡</Text>
						</TouchableOpacity>
					</View>
				)}
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
						onPress={() => {
							// Clear navigation parameters when navigating to Map via bottom nav
							setNavigationParams({});
							setSelectedBus(null);
							setCurrentScreen('Map');
						}}
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

			{/* Performance Monitor */}
			<PerformanceMonitor
				visible={showPerformanceMonitor}
				onClose={() => setShowPerformanceMonitor(false)}
			/>

		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		height: '100vh',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
		paddingHorizontal: 40,
	},
	loadingText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginTop: 20,
		textAlign: 'center',
	},
	loadingSubtext: {
		fontSize: 14,
		color: '#666',
		marginTop: 8,
		textAlign: 'center',
	},
	header: {
		backgroundColor: '#0066cc',
		paddingTop: 10,
		paddingBottom: 15,
		paddingHorizontal: 15,
		flexDirection: 'row',
		alignItems: 'center',
		zIndex: 10,
	},
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 15,
	},
	backButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
		marginLeft: 5,
	},
	debugButton: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 5,
	},
	debugButtons: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	debugButtonText: {
		fontSize: 16,
		color: '#fff',
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
		shadowColor: '#f5f5f5',
		shadowOffset: { width: 0, height: -25 },
		shadowOpacity: 1,
		shadowRadius: 25,
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
