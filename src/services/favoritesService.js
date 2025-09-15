import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@bus_app_favorites';

class FavoritesService {
	// Get all saved favorite lines
	async getFavorites() {
		try {
			const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
			return jsonValue != null ? JSON.parse(jsonValue) : [];
		} catch (error) {
			console.error('Error loading favorites:', error);
			return [];
		}
	}

	// Add a line to favorites
	async addFavorite(line) {
		try {
			const favorites = await this.getFavorites();
			
			// Check if already exists
			const exists = favorites.find(fav => fav.lineNumber === line.lineNumber && fav.destination === line.destination);
			if (exists) {
				return favorites; // Already in favorites
			}

			// Add new favorite
			const newFavorite = {
				id: `${line.lineNumber}-${Date.now()}`, // Unique ID
				lineNumber: line.lineNumber,
				destination: line.destination,
				route: line.route || 'City Route',
				direction: line.direction, // Direction ID
				directionName: line.directionName || '', // Direction name
				isFavorite: true,
				addedAt: new Date().toISOString(),
			};

			const updatedFavorites = [...favorites, newFavorite];
			await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
			
			return updatedFavorites;
		} catch (error) {
			console.error('Error adding favorite:', error);
			throw error;
		}
	}

	// Remove a line from favorites
	async removeFavorite(lineNumber, destination) {
		try {
			const favorites = await this.getFavorites();
			
			const updatedFavorites = favorites.filter(
				fav => {
					const shouldKeep = !(fav.lineNumber === lineNumber && fav.destination === destination);
					return shouldKeep;
				}
			);

			
			await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
			
			return updatedFavorites;
		} catch (error) {
			console.error('Error removing favorite:', error);
			throw error;
		}
	}

	// Check if a line is in favorites
	async isFavorite(lineNumber, destination) {
		try {
			const favorites = await this.getFavorites();
			return favorites.some(fav => fav.lineNumber === lineNumber && fav.destination === destination);
		} catch (error) {
			console.error('Error checking favorite status:', error);
			return false;
		}
	}

	// Clear all favorites (for testing/reset)
	async clearFavorites() {
		try {
			await AsyncStorage.removeItem(FAVORITES_KEY);
		} catch (error) {
			console.error('Error clearing favorites:', error);
		}
	}
}

export default new FavoritesService();
