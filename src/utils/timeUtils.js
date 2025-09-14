// Utility functions for time formatting and calculations
const timeUtils = {
	formatTime: (date) => {
		return date.toLocaleTimeString([], {
			hour: '2-digit', minute:
				'2-digit'
		});
	},

	calculateArrivalTime: (departureTime, durationMinutes) => {
		const departure = new Date(`2000-01-01T${departureTime}`);
		const arrival = new Date(departure.getTime() + durationMinutes *
			60000);
		return this.formatTime(arrival);
	},

	getRelativeTime: (minutes) => {
		if (minutes < 1) return 'Now';
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ${minutes % 60}m`;
	},
};

export default timeUtils;
