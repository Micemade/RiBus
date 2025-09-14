import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import cachedBusService from '../services/cachedBusService';

/**
 * Performance monitoring component for debugging and optimization
 * Shows cache statistics, data readiness, and performance metrics
 */
const PerformanceMonitor = ({ visible, onClose }) => {
	const [stats, setStats] = useState(null);
	const [readiness, setReadiness] = useState(null);
	const [refreshing, setRefreshing] = useState(false);

	const updateStats = async () => {
		try {
			const cacheStats = cachedBusService.getCacheStats();
			const dataReadiness = cachedBusService.getDataReadiness();
			const cacheStatus = cachedBusService.getCacheStatus();
			
			setStats({
				...cacheStats,
				...cacheStatus,
			});
			setReadiness(dataReadiness);
		} catch (error) {
			console.error('PerformanceMonitor: Error updating stats:', error);
		}
	};

	useEffect(() => {
		if (visible) {
			updateStats();
			const interval = setInterval(updateStats, 2000); // Update every 2 seconds
			return () => clearInterval(interval);
		}
	}, [visible]);

	const handleRefreshCache = async () => {
		setRefreshing(true);
		try {
			await Promise.all([
				cachedBusService.refreshLiveBuses(),
				cachedBusService.refreshAllLines(),
			]);
			await updateStats();
		} catch (error) {
			console.error('PerformanceMonitor: Refresh error:', error);
		}
		setRefreshing(false);
	};

	const handleClearCache = async () => {
		try {
			await cachedBusService.clearCache();
			await updateStats();
		} catch (error) {
			console.error('PerformanceMonitor: Clear cache error:', error);
		}
	};

	const formatTime = (timestamp) => {
		if (!timestamp) return 'Never';
		return new Date(timestamp).toLocaleTimeString();
	};

	const getStatusColor = (isReady) => {
		return isReady ? '#4CAF50' : '#FF9800';
	};

	const getStatusText = (isReady) => {
		return isReady ? 'Ready' : 'Loading';
	};

	if (!visible) return null;

	return (
		<Modal
			animationType="slide"
			transparent={true}
			visible={visible}
			onRequestClose={onClose}
		>
			<View style={styles.overlay}>
				<View style={styles.container}>
					<View style={styles.header}>
						<Text style={styles.title}>Performance Monitor</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeButtonText}>×</Text>
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.content}>
						{/* Data Readiness */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Data Readiness</Text>
							
							<View style={styles.statusRow}>
								<Text style={styles.statusLabel}>Live Buses:</Text>
								<View style={[styles.statusBadge, { backgroundColor: getStatusColor(readiness?.liveBuses) }]}>
									<Text style={styles.statusText}>{getStatusText(readiness?.liveBuses)}</Text>
								</View>
							</View>

							<View style={styles.statusRow}>
								<Text style={styles.statusLabel}>All Lines:</Text>
								<View style={[styles.statusBadge, { backgroundColor: getStatusColor(readiness?.allLines) }]}>
									<Text style={styles.statusText}>{getStatusText(readiness?.allLines)}</Text>
								</View>
							</View>

							<View style={styles.statusRow}>
								<Text style={styles.statusLabel}>Cache Ready:</Text>
								<View style={[styles.statusBadge, { backgroundColor: getStatusColor(readiness?.cacheReady) }]}>
									<Text style={styles.statusText}>{getStatusText(readiness?.cacheReady)}</Text>
								</View>
							</View>
						</View>

						{/* Cache Statistics */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Cache Statistics</Text>
							
							<View style={styles.statRow}>
								<Text style={styles.statLabel}>Hit Rate:</Text>
								<Text style={styles.statValue}>{stats?.hitRate || 0}%</Text>
							</View>

							<View style={styles.statRow}>
								<Text style={styles.statLabel}>Cache Hits:</Text>
								<Text style={styles.statValue}>{stats?.hits || 0}</Text>
							</View>

							<View style={styles.statRow}>
								<Text style={styles.statLabel}>Cache Misses:</Text>
								<Text style={styles.statValue}>{stats?.misses || 0}</Text>
							</View>

							<View style={styles.statRow}>
								<Text style={styles.statLabel}>Background Refreshes:</Text>
								<Text style={styles.statValue}>{stats?.backgroundRefreshes || 0}</Text>
							</View>

							<View style={styles.statRow}>
								<Text style={styles.statLabel}>Persistence Hits:</Text>
								<Text style={styles.statValue}>{stats?.persistenceHits || 0}</Text>
							</View>

							<View style={styles.statRow}>
								<Text style={styles.statLabel}>Memory Size:</Text>
								<Text style={styles.statValue}>{stats?.memorySize || 0} items</Text>
							</View>

							<View style={styles.statRow}>
								<Text style={styles.statLabel}>Total Cached:</Text>
								<Text style={styles.statValue}>{stats?.totalCachedItems || 0} items</Text>
							</View>
						</View>

						{/* Cache Status Details */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Cache Details</Text>
							
							<View style={styles.detailRow}>
								<Text style={styles.detailLabel}>Live Buses:</Text>
								<Text style={styles.detailValue}>
									{stats?.liveBuses?.ageFormatted || 'Not cached'}
									{stats?.liveBuses?.inMemory ? ' (Memory)' : ' (Disk)'}
								</Text>
							</View>

							<View style={styles.detailRow}>
								<Text style={styles.detailLabel}>All Lines:</Text>
								<Text style={styles.detailValue}>
									{stats?.allLines?.ageFormatted || 'Not cached'}
									{stats?.allLines?.inMemory ? ' (Memory)' : ' (Disk)'}
								</Text>
							</View>
						</View>

						{/* Actions */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Actions</Text>
							
							<TouchableOpacity 
								style={[styles.actionButton, refreshing && styles.actionButtonDisabled]}
								onPress={handleRefreshCache}
								disabled={refreshing}
							>
								<Text style={styles.actionButtonText}>
									{refreshing ? 'Refreshing...' : 'Refresh Cache'}
								</Text>
							</TouchableOpacity>

							<TouchableOpacity 
								style={[styles.actionButton, styles.actionButtonDanger]}
								onPress={handleClearCache}
							>
								<Text style={styles.actionButtonText}>Clear Cache</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		width: '90%',
		maxHeight: '80%',
		backgroundColor: '#fff',
		borderRadius: 12,
		overflow: 'hidden',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#0066cc',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#fff',
	},
	closeButton: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	closeButtonText: {
		fontSize: 20,
		color: '#fff',
		fontWeight: 'bold',
	},
	content: {
		flex: 1,
		padding: 16,
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333',
	},
	statusRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	statusLabel: {
		fontSize: 14,
		color: '#666',
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	statusText: {
		fontSize: 12,
		color: '#fff',
		fontWeight: 'bold',
	},
	statRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	statLabel: {
		fontSize: 14,
		color: '#666',
	},
	statValue: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#333',
	},
	detailRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	detailLabel: {
		fontSize: 14,
		color: '#666',
	},
	detailValue: {
		fontSize: 14,
		color: '#333',
	},
	actionButton: {
		backgroundColor: '#0066cc',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 8,
	},
	actionButtonDisabled: {
		backgroundColor: '#ccc',
	},
	actionButtonDanger: {
		backgroundColor: '#f44336',
	},
	actionButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
});

export default PerformanceMonitor;
