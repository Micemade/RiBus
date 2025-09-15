import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Advanced data cache service with memory + persistence
 * Provides instant data access with smart background refresh
 */
class DataCache {
	constructor() {
		this.memoryCache = new Map();
		this.cacheTimestamps = new Map();
		this.pendingRequests = new Map();
		this.subscribers = new Map();
		
		// Configuration
		this.config = {
			defaultTTL: 5 * 60 * 1000, // 5 minutes default TTL
			maxMemorySize: 100, // Max items in memory
			persistencePrefix: 'RiBus_Cache_',
			backgroundRefreshThreshold: 2 * 60 * 1000, // Start background refresh 2 min before expiry
		};
		
		// Performance metrics
		this.metrics = {
			hits: 0,
			misses: 0,
			backgroundRefreshes: 0,
			persistenceHits: 0,
		};
		
		this.initialized = false;
		this.init();
	}
	
	async init() {
		if (this.initialized) return;
		
		try {
			// Load cache timestamps from persistence
			const timestampsJson = await AsyncStorage.getItem(`${this.config.persistencePrefix}timestamps`);
			if (timestampsJson) {
				const timestamps = JSON.parse(timestampsJson);
				Object.entries(timestamps).forEach(([key, timestamp]) => {
					this.cacheTimestamps.set(key, timestamp);
				});
			}

			this.initialized = true;
		} catch (error) {
			console.error('DataCache: Initialization error:', error);
			this.initialized = true; // Continue without persistence
		}
	}
	
	/**
	 * Get data from cache or fetch function
	 * @param {string} key - Cache key
	 * @param {Function} fetchFn - Function to fetch fresh data
	 * @param {Object} options - Cache options
	 */
	async get(key, fetchFn, options = {}) {
		await this.init();
		
		const opts = {
			ttl: options.ttl || this.config.defaultTTL,
			persistData: options.persistData !== false,
			backgroundRefresh: options.backgroundRefresh !== false,
			...options
		};
		
		const now = Date.now();
		const timestamp = this.cacheTimestamps.get(key);
		const isExpired = !timestamp || (now - timestamp) > opts.ttl;
		const shouldBackgroundRefresh = timestamp && 
			(now - timestamp) > (opts.ttl - this.config.backgroundRefreshThreshold);
		
		// Check memory cache first
		if (this.memoryCache.has(key) && !isExpired) {
			this.metrics.hits++;
			
			// Trigger background refresh if needed
			if (shouldBackgroundRefresh && opts.backgroundRefresh) {
				this.backgroundRefresh(key, fetchFn, opts);
			}
			
			return this.memoryCache.get(key);
		}
		
		// Check persistence cache if not in memory
		if (!this.memoryCache.has(key) && !isExpired) {
			try {
				const persistedData = await AsyncStorage.getItem(`${this.config.persistencePrefix}${key}`);
				if (persistedData) {
					const data = JSON.parse(persistedData);
					this.memoryCache.set(key, data);
					this.cleanupMemoryCache();
					this.metrics.persistenceHits++;
					
					// Trigger background refresh if needed
					if (shouldBackgroundRefresh && opts.backgroundRefresh) {
						this.backgroundRefresh(key, fetchFn, opts);
					}
					
					return data;
				}
			} catch (error) {
				console.warn('DataCache: Persistence read error:', error);
			}
		}
		
		// Data is expired or doesn't exist, fetch fresh data
		this.metrics.misses++;
		return await this.fetchAndCache(key, fetchFn, opts);
	}
	
	/**
	 * Force refresh data and update cache
	 */
	async refresh(key, fetchFn, options = {}) {
		await this.init();
		
		const opts = {
			ttl: options.ttl || this.config.defaultTTL,
			persistData: options.persistData !== false,
			...options
		};
		
		return await this.fetchAndCache(key, fetchFn, opts);
	}
	
	/**
	 * Fetch data and cache it
	 */
	async fetchAndCache(key, fetchFn, options) {
		// Prevent duplicate requests
		if (this.pendingRequests.has(key)) {
			return await this.pendingRequests.get(key);
		}
		
		const fetchPromise = this.executeFetch(key, fetchFn, options);
		this.pendingRequests.set(key, fetchPromise);
		
		try {
			const data = await fetchPromise;
			return data;
		} finally {
			this.pendingRequests.delete(key);
		}
	}
	
	async executeFetch(key, fetchFn, options) {
		try {
			const data = await fetchFn();
			
			// Update cache
			this.memoryCache.set(key, data);
			this.cacheTimestamps.set(key, Date.now());
			this.cleanupMemoryCache();
			
			// Persist if enabled
			if (options.persistData) {
				await this.persistData(key, data);
			}
			
			// Notify subscribers
			this.notifySubscribers(key, data);
			
			return data;
		} catch (error) {
			console.error(`DataCache: Fetch error for ${key}:`, error);
			
			// Try to return stale data if available
			if (this.memoryCache.has(key)) {
				return this.memoryCache.get(key);
			}
			
			throw error;
		}
	}
	
	/**
	 * Background refresh without blocking current request
	 */
	async backgroundRefresh(key, fetchFn, options) {
		if (this.pendingRequests.has(key)) {
			return; // Already refreshing
		}
		
		this.metrics.backgroundRefreshes++;
		
		try {
			await this.fetchAndCache(key, fetchFn, options);
		} catch (error) {
			console.warn(`DataCache: Background refresh failed for ${key}:`, error);
		}
	}
	
	/**
	 * Persist data to AsyncStorage
	 */
	async persistData(key, data) {
		try {
			await AsyncStorage.setItem(`${this.config.persistencePrefix}${key}`, JSON.stringify(data));
			
			// Update timestamps
			const timestamps = {};
			this.cacheTimestamps.forEach((timestamp, cacheKey) => {
				timestamps[cacheKey] = timestamp;
			});
			await AsyncStorage.setItem(`${this.config.persistencePrefix}timestamps`, JSON.stringify(timestamps));
		} catch (error) {
			console.warn('DataCache: Persistence write error:', error);
		}
	}
	
	/**
	 * Subscribe to cache updates
	 */
	subscribe(key, callback) {
		if (!this.subscribers.has(key)) {
			this.subscribers.set(key, new Set());
		}
		this.subscribers.get(key).add(callback);
		
		// Return unsubscribe function
		return () => {
			const keySubscribers = this.subscribers.get(key);
			if (keySubscribers) {
				keySubscribers.delete(callback);
				if (keySubscribers.size === 0) {
					this.subscribers.delete(key);
				}
			}
		};
	}
	
	/**
	 * Notify subscribers of data changes
	 */
	notifySubscribers(key, data) {
		const keySubscribers = this.subscribers.get(key);
		if (keySubscribers) {
			keySubscribers.forEach(callback => {
				try {
					callback(data);
				} catch (error) {
					console.error('DataCache: Subscriber callback error:', error);
				}
			});
		}
	}
	
	/**
	 * Clean up memory cache to prevent memory leaks
	 */
	cleanupMemoryCache() {
		if (this.memoryCache.size <= this.config.maxMemorySize) {
			return;
		}
		
		// Remove oldest entries
		const entries = Array.from(this.cacheTimestamps.entries())
			.sort((a, b) => a[1] - b[1]);
		
		const toRemove = entries.slice(0, this.memoryCache.size - this.config.maxMemorySize);
		toRemove.forEach(([key]) => {
			this.memoryCache.delete(key);
		});
	}
	
	/**
	 * Preload data for multiple keys
	 */
	async preload(items) {
		const promises = items.map(({ key, fetchFn, options }) => 
			this.get(key, fetchFn, options).catch(error => {
				console.warn(`DataCache: Preload failed for ${key}:`, error);
				return null;
			})
		);
		
		return await Promise.allSettled(promises);
	}
	
	/**
	 * Clear cache for specific key or all data
	 */
	async clear(key = null) {
		if (key) {
			this.memoryCache.delete(key);
			this.cacheTimestamps.delete(key);
			try {
				await AsyncStorage.removeItem(`${this.config.persistencePrefix}${key}`);
			} catch (error) {
				console.warn('DataCache: Clear persistence error:', error);
			}
		} else {
			this.memoryCache.clear();
			this.cacheTimestamps.clear();
			try {
				const keys = await AsyncStorage.getAllKeys();
				const cacheKeys = keys.filter(k => k.startsWith(this.config.persistencePrefix));
				await AsyncStorage.multiRemove(cacheKeys);
			} catch (error) {
				console.warn('DataCache: Clear all persistence error:', error);
			}
		}
	}
	
	/**
	 * Get cache statistics
	 */
	getStats() {
		const totalRequests = this.metrics.hits + this.metrics.misses;
		return {
			...this.metrics,
			hitRate: totalRequests > 0 ? (this.metrics.hits / totalRequests * 100).toFixed(2) : 0,
			memorySize: this.memoryCache.size,
			totalCachedItems: this.cacheTimestamps.size,
		};
	}
	
	/**
	 * Get cache status for a specific key
	 */
	getStatus(key) {
		const timestamp = this.cacheTimestamps.get(key);
		const inMemory = this.memoryCache.has(key);
		const age = timestamp ? Date.now() - timestamp : null;
		
		return {
			exists: !!timestamp,
			inMemory,
			age,
			ageFormatted: age ? `${Math.round(age / 1000)}s` : null,
		};
	}
}

// Create singleton instance
const dataCache = new DataCache();

export default dataCache;
