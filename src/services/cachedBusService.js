import busService from './busService';
import dataCache from './dataCache';

/**
 * Cached wrapper around busService for optimal performance
 * Provides instant data access with smart background refresh
 */
class CachedBusService {
	constructor() {
		this.cacheKeys = {
			liveBuses: 'live_buses',
			allLines: 'all_lines',
			lineDetails: 'line_details_',
			liveSchedule: 'live_schedule_',
			tripDepartures: 'trip_departures_',
		};
		
		// Cache configuration for different data types
		this.cacheConfig = {
			liveBuses: {
				ttl: 30 * 1000, // 30 seconds for live data
				backgroundRefresh: true,
				persistData: true,
			},
			allLines: {
				ttl: 60 * 60 * 1000, // 1 hour for static line data
				backgroundRefresh: true,
				persistData: true,
			},
			lineDetails: {
				ttl: 10 * 60 * 1000, // 10 minutes for line details
				backgroundRefresh: true,
				persistData: true,
			},
			liveSchedule: {
				ttl: 60 * 1000, // 1 minute for schedule data
				backgroundRefresh: true,
				persistData: true,
			},
		};
		
		// Subscribe to data changes for real-time updates
		this.subscribers = new Map();
		this.setupGlobalUpdates();
	}
	
	/**
	 * Get live buses with caching
	 */
	async getLiveBuses() {
		const startTime = Date.now();
		
		try {
			const data = await dataCache.get(
				this.cacheKeys.liveBuses,
				() => busService.getLiveBuses(),
				this.cacheConfig.liveBuses
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getLiveBuses completed in ${loadTime}ms`);
			
			return data || [];
		} catch (error) {
			console.error('CachedBusService: getLiveBuses error:', error);
			return [];
		}
	}
	
	/**
	 * Get all bus lines with caching
	 */
	async getAllLines() {
		const startTime = Date.now();
		
		try {
			const data = await dataCache.get(
				this.cacheKeys.allLines,
				() => busService.getAllLines(),
				this.cacheConfig.allLines
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getAllLines completed in ${loadTime}ms`);
			
			return data || [];
		} catch (error) {
			console.error('CachedBusService: getAllLines error:', error);
			return [];
		}
	}
	
	/**
	 * Get line details with caching
	 */
	async getLineDetails(lineId) {
		if (!lineId) return null;
		
		const startTime = Date.now();
		const cacheKey = `${this.cacheKeys.lineDetails}${lineId}`;
		
		try {
			const data = await dataCache.get(
				cacheKey,
				() => busService.getLineDetails(lineId),
				this.cacheConfig.lineDetails
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getLineDetails(${lineId}) completed in ${loadTime}ms`);
			
			return data;
		} catch (error) {
			console.error(`CachedBusService: getLineDetails(${lineId}) error:`, error);
			return null;
		}
	}
	
	/**
	 * Get live schedule with caching
	 */
	async getLiveSchedule(lineId) {
		if (!lineId) return [];
		
		const startTime = Date.now();
		const cacheKey = `${this.cacheKeys.liveSchedule}${lineId}`;
		
		try {
			const data = await dataCache.get(
				cacheKey,
				() => busService.getLiveSchedule(lineId),
				this.cacheConfig.liveSchedule
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getLiveSchedule(${lineId}) completed in ${loadTime}ms`);
			
			return data || [];
		} catch (error) {
			console.error(`CachedBusService: getLiveSchedule(${lineId}) error:`, error);
			return [];
		}
	}
	
	/**
	 * Get bus schedule with caching
	 */
	async getBusSchedule(lineNumber) {
		if (!lineNumber) return [];
		
		const startTime = Date.now();
		const cacheKey = `bus_schedule_${lineNumber}`;
		
		try {
			const data = await dataCache.get(
				cacheKey,
				() => busService.getBusSchedule(lineNumber),
				{
					ttl: 5 * 60 * 1000, // 5 minutes for schedule data
					backgroundRefresh: true,
					persistData: true,
				}
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getBusSchedule(${lineNumber}) completed in ${loadTime}ms`);
			
			return data || [];
		} catch (error) {
			console.error(`CachedBusService: getBusSchedule(${lineNumber}) error:`, error);
			return [];
		}
	}
	
	/**
	 * Get bus schedule by rides with caching
	 */
	async getBusScheduleByRides(lineNumber) {
		if (!lineNumber) return [];
		
		const startTime = Date.now();
		const cacheKey = `bus_schedule_rides_${lineNumber}`;
		
		try {
			const data = await dataCache.get(
				cacheKey,
				() => busService.getBusScheduleByRides(lineNumber),
				{
					ttl: 2 * 60 * 1000, // 2 minutes for rides data (more frequent updates)
					backgroundRefresh: true,
					persistData: true,
				}
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getBusScheduleByRides(${lineNumber}) completed in ${loadTime}ms`);
			
			return data || [];
		} catch (error) {
			console.error(`CachedBusService: getBusScheduleByRides(${lineNumber}) error:`, error);
			return [];
		}
	}
	
	/**
	 * Force refresh specific data type
	 */
	async refreshLiveBuses() {
		console.log('CachedBusService: Force refreshing live buses');
		return await dataCache.refresh(
			this.cacheKeys.liveBuses,
			() => busService.getLiveBuses(),
			this.cacheConfig.liveBuses
		);
	}
	
	async refreshAllLines() {
		console.log('CachedBusService: Force refreshing all lines');
		return await dataCache.refresh(
			this.cacheKeys.allLines,
			() => busService.getAllLines(),
			this.cacheConfig.allLines
		);
	}
	
	async refreshLineDetails(lineId) {
		if (!lineId) return null;
		
		console.log(`CachedBusService: Force refreshing line details for ${lineId}`);
		const cacheKey = `${this.cacheKeys.lineDetails}${lineId}`;
		return await dataCache.refresh(
			cacheKey,
			() => busService.getLineDetails(lineId),
			this.cacheConfig.lineDetails
		);
	}
	
	/**
	 * Preload essential data for instant screen switching
	 */
	async preloadEssentialData() {
		console.log('CachedBusService: Starting essential data preload');
		const startTime = Date.now();
		
		const preloadItems = [
			{
				key: this.cacheKeys.liveBuses,
				fetchFn: () => busService.getLiveBuses(),
				options: this.cacheConfig.liveBuses,
			},
			{
				key: this.cacheKeys.allLines,
				fetchFn: () => busService.getAllLines(),
				options: this.cacheConfig.allLines,
			},
		];
		
		try {
			await dataCache.preload(preloadItems);
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: Essential data preload completed in ${loadTime}ms`);
		} catch (error) {
			console.error('CachedBusService: Essential data preload error:', error);
		}
	}
	
	/**
	 * Subscribe to live bus updates
	 */
	subscribeLiveBuses(callback) {
		return dataCache.subscribe(this.cacheKeys.liveBuses, callback);
	}
	
	/**
	 * Subscribe to line data updates
	 */
	subscribeAllLines(callback) {
		return dataCache.subscribe(this.cacheKeys.allLines, callback);
	}
	
	/**
	 * Subscribe to specific line details updates
	 */
	subscribeLineDetails(lineId, callback) {
		const cacheKey = `${this.cacheKeys.lineDetails}${lineId}`;
		return dataCache.subscribe(cacheKey, callback);
	}
	
	/**
	 * Setup global periodic updates for live data
	 */
	setupGlobalUpdates() {
		// Update live buses every 30 seconds
		setInterval(() => {
			this.refreshLiveBuses().catch(error => {
				console.warn('CachedBusService: Periodic live buses update failed:', error);
			});
		}, 30000);
		
		// Update all lines every 30 minutes
		setInterval(() => {
			this.refreshAllLines().catch(error => {
				console.warn('CachedBusService: Periodic lines update failed:', error);
			});
		}, 30 * 60 * 1000);
	}
	
	/**
	 * Get cache statistics
	 */
	getCacheStats() {
		return dataCache.getStats();
	}
	
	/**
	 * Get detailed cache status
	 */
	getCacheStatus() {
		return {
			liveBuses: dataCache.getStatus(this.cacheKeys.liveBuses),
			allLines: dataCache.getStatus(this.cacheKeys.allLines),
			cacheStats: this.getCacheStats(),
		};
	}
	
	/**
	 * Get bus location with caching
	 */
	async getBusLocation(lineNumber) {
		if (!lineNumber) return null;
		
		const startTime = Date.now();
		const cacheKey = `bus_location_${lineNumber}`;
		
		try {
			const data = await dataCache.get(
				cacheKey,
				() => busService.getBusLocation(lineNumber),
				{
					ttl: 30 * 1000, // 30 seconds for location data (real-time)
					backgroundRefresh: true,
					persistData: false, // Don't persist real-time location data
				}
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getBusLocation(${lineNumber}) completed in ${loadTime}ms`);
			
			return data;
		} catch (error) {
			console.error(`CachedBusService: getBusLocation(${lineNumber}) error:`, error);
			return null;
		}
	}
	
	/**
	 * Get bus lines with caching (alternative method)
	 */
	async getBusLines() {
		const startTime = Date.now();
		
		try {
			const data = await dataCache.get(
				'bus_lines',
				() => busService.getBusLines(),
				{
					ttl: 60 * 60 * 1000, // 1 hour for static line data
					backgroundRefresh: true,
					persistData: true,
				}
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getBusLines completed in ${loadTime}ms`);
			
			return data || [];
		} catch (error) {
			console.error('CachedBusService: getBusLines error:', error);
			return [];
		}
	}
	
	/**
	 * Get stations with caching
	 */
	async getStations() {
		const startTime = Date.now();
		
		try {
			const data = await dataCache.get(
				'stations',
				() => busService.getStations(),
				{
					ttl: 24 * 60 * 60 * 1000, // 24 hours for station data (very static)
					backgroundRefresh: true,
					persistData: true,
				}
			);
			
			const loadTime = Date.now() - startTime;
			console.log(`CachedBusService: getStations completed in ${loadTime}ms`);
			
			return data || [];
		} catch (error) {
			console.error('CachedBusService: getStations error:', error);
			return [];
		}
	}
	
	/**
	 * Analyze API structure (passthrough for debugging)
	 */
	async analyzeAPIStructure() {
		try {
			return await busService.analyzeAPIStructure();
		} catch (error) {
			console.error('CachedBusService: analyzeAPIStructure error:', error);
			return null;
		}
	}

	/**
	 * Clear specific cache or all cache
	 */
	async clearCache(type = null) {
		if (type && this.cacheKeys[type]) {
			await dataCache.clear(this.cacheKeys[type]);
			console.log(`CachedBusService: Cleared ${type} cache`);
		} else {
			await dataCache.clear();
			console.log('CachedBusService: Cleared all cache');
		}
	}
	
	/**
	 * Warmup cache with most commonly needed data
	 */
	async warmupCache() {
		console.log('CachedBusService: Starting cache warmup');
		const startTime = Date.now();
		
		try {
			// Load essential data in parallel
			await Promise.allSettled([
				this.getLiveBuses(),
				this.getAllLines(),
			]);
			
			const warmupTime = Date.now() - startTime;
			console.log(`CachedBusService: Cache warmup completed in ${warmupTime}ms`);
		} catch (error) {
			console.error('CachedBusService: Cache warmup error:', error);
		}
	}
	
	/**
	 * Check if data is readily available (cached and fresh)
	 */
	isDataReady(type) {
		const cacheKey = this.cacheKeys[type];
		if (!cacheKey) return false;
		
		const status = dataCache.getStatus(cacheKey);
		const config = this.cacheConfig[type];
		
		return status.exists && 
			   status.inMemory && 
			   status.age < config.ttl;
	}
	
	/**
	 * Get data readiness status for all main data types
	 */
	getDataReadiness() {
		return {
			liveBuses: this.isDataReady('liveBuses'),
			allLines: this.isDataReady('allLines'),
			cacheReady: dataCache.memoryCache.size > 0,
		};
	}
}

// Create singleton instance
const cachedBusService = new CachedBusService();

export default cachedBusService;
