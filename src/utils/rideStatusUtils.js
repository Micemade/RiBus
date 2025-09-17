// Utility functions for determining ride and station statuses
const getRideStatus = (ride) => {
	const now = new Date();
	
	if (!ride.departures || ride.departures.length === 0) {
		return 'unknown';
	}
	
	// Parse departure times - handle both "HH:MM" format and ISO datetime
	const departureTimes = ride.departures.map(dep => {
		if (!dep.time || dep.time === 'N/A') return null;
		
		// If it's just time format "HH:MM", assume today
		if (dep.time.match(/^\d{2}:\d{2}$/)) {
			const today = new Date();
			const [hours, minutes] = dep.time.split(':');
			return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
							parseInt(hours), parseInt(minutes));
		}
		
		// If it's ISO format from API "2025-09-13T06:53:00"
		if (dep.time.includes('T')) {
			return new Date(dep.time);
		}
		
		return null;
	}).filter(time => time !== null);
	
	if (departureTimes.length === 0) return 'unknown';
	
	const firstDeparture = new Date(Math.min(...departureTimes));
	const lastDeparture = new Date(Math.max(...departureTimes));
	
	// Add buffer time for active rides (5 minutes after last departure)
	const rideEndTime = new Date(lastDeparture.getTime() + 5 * 60 * 1000);
	
	if (now < firstDeparture) {
		return 'upcoming'; // Future ride
	} else if (now >= firstDeparture && now <= rideEndTime) {
		return 'active'; // Currently running
	} else {
		return 'expired'; // Past ride
	}
};

const getStationStatus = (departure, ride) => {
	const rideStatus = getRideStatus(ride);
	
	if (rideStatus !== 'active') {
		return rideStatus === 'expired' ? 'visited' : 'upcoming';
	}
	
	// For active rides, determine individual station status
	const now = new Date();
	let departureTime;
	
	// Parse departure time
	if (departure.time && departure.time !== 'N/A') {
		if (departure.time.match(/^\d{2}:\d{2}$/)) {
			const today = new Date();
			const [hours, minutes] = departure.time.split(':');
			departureTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
		} else if (departure.time.includes('T')) {
			departureTime = new Date(departure.time);
		}
	}
	
	if (!departureTime) return 'unknown';
	
	// Station status with buffer times
	const arrivalBuffer = 2 * 60 * 1000; // 2 minutes before = approaching
	const departureBuffer = 1 * 60 * 1000; // 1 minute after = recently departed
	
	if (now < departureTime - arrivalBuffer) {
		return 'upcoming'; // Not reached yet
	} else if (now >= departureTime - arrivalBuffer && now <= departureTime + departureBuffer) {
		return 'current'; // Currently at station or approaching
	} else {
		return 'visited'; // Already departed
	}
};

const getNextStation = (ride) => {
	const now = new Date();
	
	if (!ride.departures || ride.departures.length === 0) return null;
	
	// Find the next station that hasn't been visited yet
	for (const departure of ride.departures) {
		if (getStationStatus(departure, ride) === 'upcoming' || 
			getStationStatus(departure, ride) === 'current') {
			return departure;
		}
	}
	
	return null; // All stations visited
};

const getRideProgress = (ride) => {
	if (!ride.departures || ride.departures.length === 0) return 0;
	
	const totalStations = ride.departures.length;
	const visitedStations = ride.departures.filter(dep => 
		getStationStatus(dep, ride) === 'visited'
	).length;
	
	return Math.round((visitedStations / totalStations) * 100);
};

export {
	getRideStatus,
	getStationStatus,
	getNextStation,
	getRideProgress
};
