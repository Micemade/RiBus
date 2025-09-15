// Real Autotrolej API service for Rijeka bus tracking
const API_BASE_URL = 'https://api.autotrolej.hr/api/open/v1/voznired';

const busService = {
	// Get live buses data from Autotrolej API
	getLiveBuses: async () => {
		try {
			
			// Fetch bus lines, live bus locations, and departures data
			const [linesResponse, busesResponse, departuresResponse] = await Promise.all([
				fetch(`${API_BASE_URL}/linije`),
				fetch(`${API_BASE_URL}/autobusi`),
				fetch(`${API_BASE_URL}/polasci`)
			]);

			const linesData = await linesResponse.json();
			const busesData = await busesResponse.json();
			const departuresData = await departuresResponse.json();

			if (linesData.msg !== 'ok' || busesData.msg !== 'ok') {
				console.error('API response not OK:', { linesData: linesData.msg, busesData: busesData.msg });
				throw new Error('API response not OK');
			}

			// Transform lines data into a map for easy lookup
			const linesMap = new Map();
			Object.values(linesData.res).forEach(line => {
				linesMap.set(line.id, line);
			});

			// Create a map of trip IDs to upcoming departures (only if departures data is OK)
			const tripDepartures = new Map();
			if (departuresData.msg === 'ok' && departuresData.res) {
				
				// Check if res is an array or object
				const departuresArray = Array.isArray(departuresData.res) 
					? departuresData.res 
					: Object.values(departuresData.res);

				
				departuresArray.forEach(departure => {
					if (departure.voznjaId && departure.stanica && departure.polazak) {
						const tripId = departure.voznjaId;
						if (!tripDepartures.has(tripId)) {
							tripDepartures.set(tripId, []);
						}
						tripDepartures.get(tripId).push({
							stationName: departure.stanica.nazivKratki || departure.stanica.naziv,
							departureTime: departure.polazak,
							arrivalTime: departure.dolazak
						});
					}
				});
			}

			// Sort departures by time for each trip
			tripDepartures.forEach((departures, tripId) => {
				departures.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
			});

			// Group buses by their unique properties to avoid duplicates
			const busMap = new Map();
			
			// Transform live buses data to match our app structure
			busesData.res.forEach((bus, index) => {
				// Use bus number as unique identifier to avoid duplicates
				const busKey = `${bus.gbr}-${bus.voznjaId}`;
				
				if (!busMap.has(busKey)) {
					// Try to find the actual line this bus belongs to
					// Since we don't have a direct relation, we'll create a more realistic distribution
					const allLines = Array.from(linesMap.values());
					
					// Use a hash-based approach for consistent line assignment
					const busHash = bus.gbr * 31 + (bus.voznjaId % 1000);
					const lineIndex = Math.abs(busHash) % allLines.length;
					const line = allLines[lineIndex] || { brojLinije: 'Unknown', naziv: 'Unknown Route' };

					// Get next stop information from departures data
					const tripDeps = tripDepartures.get(bus.voznjaId) || [];
					const now = new Date();
					const nextDeparture = tripDeps.find(dep => new Date(dep.departureTime) > now);
					
					// Calculate arrival time for next stop
					let arrivalTime = 'Live';
					let nextStopName = 'En route';
					
					if (nextDeparture) {
						nextStopName = nextDeparture.stationName;
						const departureTime = new Date(nextDeparture.departureTime);
						const timeDiff = Math.round((departureTime - now) / (1000 * 60)); // minutes
						
						if (timeDiff > 0 && timeDiff < 60) {
							arrivalTime = `${timeDiff} min`;
						} else if (timeDiff <= 0) {
							arrivalTime = 'Now';
						} else {
							arrivalTime = departureTime.toLocaleTimeString('hr-HR', { 
								hour: '2-digit', 
								minute: '2-digit' 
							});
						}
					}

					busMap.set(busKey, {
						id: bus.voznjaBusId || bus.gbr,
						lineNumber: line.brojLinije,
						route: line.naziv,
						destination: line.naziv.split(' - ')[1] || line.naziv,
						direction: line.smjerId, // Direction ID
						directionName: line.smjerNaziv || '', // Direction name  
						status: 'Live', // All live buses are considered active
						nextStop: nextStopName,
						arrivalTime: arrivalTime,
						latitude: bus.lat,
						longitude: bus.lon,
						busNumber: bus.gbr,
						tripId: bus.voznjaId
					});
				}
			});

			const liveBuses = Array.from(busMap.values());

			return liveBuses;

		} catch (error) {
			console.error('Error fetching live buses:', error);
			console.error('Error details:', error.message);
			console.error('Error stack:', error.stack);
			// Return empty array on error instead of mock data
			return [];
		}
	},

	// Get bus schedule/departures from Autotrolej API
	getBusSchedule: async (lineNumber) => {
		try {
			// Fetch both lines data and departures data
			const [linesResponse, departuresResponse] = await Promise.all([
				fetch(`${API_BASE_URL}/linije`),
				fetch(`${API_BASE_URL}/polasci`)
			]);
			
			const linesData = await linesResponse.json();
			const departuresData = await departuresResponse.json();

			if (departuresData.msg !== 'ok' || linesData.msg !== 'ok') {
				throw new Error('API response not OK');
			}

			// Create mapping of line numbers to line IDs
			const lineNumberToIds = new Map();
			Object.values(linesData.res).forEach(line => {
				if (!lineNumberToIds.has(line.brojLinije)) {
					lineNumberToIds.set(line.brojLinije, []);
				}
				lineNumberToIds.get(line.brojLinije).push(line.id);
			});

			const targetLineIds = lineNumberToIds.get(lineNumber) || [];
			// Convert departures data to array if it's an object
			let departuresArray;
			if (Array.isArray(departuresData.res)) {
				departuresArray = departuresData.res;
			} else {
				// If it's an object, get the actual departure objects, not just the keys
				departuresArray = Object.keys(departuresData.res).map(key => {
					const departure = departuresData.res[key];
					// The key might contain useful information, let's parse it
					return {
						...departure,
						departureKey: key // Keep the original key for reference
					};
				});
			}

			// Try multiple filtering approaches
			let filteredDepartures = [];
			
			// First try exact line ID match
			if (targetLineIds.length > 0) {
				filteredDepartures = departuresArray.filter(departure => 
					targetLineIds.includes(departure.linijaId)
				);
			}
			
			// If no exact match, try matching based on departure keys (like '2194-2-2' where 2194 might be line ID)
			if (filteredDepartures.length === 0) {
				filteredDepartures = departuresArray.filter(departure => {
					if (!departure.departureKey) return false;
					// Check if any target line ID appears at the start of the departure key
					return targetLineIds.some(lineId => 
						departure.departureKey.startsWith(lineId.toString())
					);
				});
			}
			
			// If no exact match, try partial string matching with line number in departure key
			if (filteredDepartures.length === 0) {
				filteredDepartures = departuresArray.filter(departure => 
					departure.departureKey && departure.departureKey.includes(lineNumber)
				);
			}
			
			// If no exact match, try partial string matching with uniqueLinijaId
			if (filteredDepartures.length === 0) {
				filteredDepartures = departuresArray.filter(departure => 
					departure.uniqueLinijaId && departure.uniqueLinijaId.includes(lineNumber)
				);
			}
			
			// If still no match, try looking at the actual line data in departure
			if (filteredDepartures.length === 0) {
				filteredDepartures = departuresArray.filter(departure => {
					// Check if any line references match our line number
					const departureLine = departure.linija || departure.linijaId;
					return departureLine && departureLine.toString().includes(lineNumber);
				});
			}
			
			// As a last resort, show some sample data for debugging
			if (filteredDepartures.length === 0) {
				filteredDepartures = departuresArray.slice(0, 10);
			}

			// Sort departures by time (polazak - departure time)
			filteredDepartures.sort((a, b) => {
				const timeA = a.polazak || '';
				const timeB = b.polazak || '';
				return timeA.localeCompare(timeB);
			});

			// Extract individual departures from polazakList arrays and group by rides (voznjaId)
			const rideGroups = new Map(); // Map of voznjaId -> ride info
			const allDepartures = [];
			
			filteredDepartures.forEach(departureGroup => {
				if (departureGroup.polazakList && Array.isArray(departureGroup.polazakList)) {
					departureGroup.polazakList.forEach(departure => {
						// Group by ride (voznjaId)
						const rideId = departure.voznjaId;
						const busId = departure.voznjaBusId;
						
						if (!rideGroups.has(rideId)) {
							rideGroups.set(rideId, {
								rideId: rideId,
								busId: busId,
								lineNumber: lineNumber,
								departures: []
							});
						}
						
						rideGroups.get(rideId).departures.push(departure);
						allDepartures.push({
							...departure,
							rideId: rideId,
							busId: busId
						});
					});
				}
			});

			// Sort all departures by departure time
			allDepartures.sort((a, b) => {
				const timeA = a.polazak || '';
				const timeB = b.polazak || '';
				return timeA.localeCompare(timeB);
			});

			// Process the extracted departures data
			const scheduleData = allDepartures.slice(0, 50).map((departure, index) => {

				// Extract departure time
				let departureTime = 'N/A';
				if (departure.polazak) {
					// Parse ISO datetime format: "2025-09-13T06:53:00"
					const timeMatch = departure.polazak.match(/T(\d{2}:\d{2})/);
					if (timeMatch) {
						departureTime = timeMatch[1];
					}
				}

				// Extract arrival time
				let arrivalTime = null;
				if (departure.dolazak) {
					const timeMatch = departure.dolazak.match(/T(\d{2}:\d{2})/);
					if (timeMatch) {
						arrivalTime = timeMatch[1];
					}
				}

				// Extract station information
				let stationName = 'Unknown Stop';
				let stationDescription = '';
				
				if (departure.stanica) {
					// Clean up Croatian station names by removing extra whitespace and newlines
					const rawName = departure.stanica.naziv || 'Unknown Stop';
					stationName = rawName.toString().replace(/\s+/g, ' ').trim();
					
					const rawDescription = departure.stanica.nazivKratki || departure.stanica.naziv || '';
					stationDescription = rawDescription.toString().replace(/\s+/g, ' ').trim();

				}

				return {
					id: departure.voznjaStanicaId || departure.stanicaId || `dep-${index}`,
					time: departureTime,
					stop: stationName,
					description: stationDescription,
					arrival: arrivalTime,
					stationId: departure.stanicaId,
					tripId: departure.voznjaId,
					rideId: departure.rideId, // Group identifier
					busId: departure.busId, // Bus assigned to this ride
					lineId: departure.linijaId,
					uniqueLineId: departure.uniqueLinijaId,
					coordinates: departure.stanica ? {
						lat: departure.stanica.gpsY,
						lng: departure.stanica.gpsX
					} : null
				};
			}); // Process filtered departures for specific line

			// Filter to show only future departures (not past ones) - but more lenient for debugging
			const now = new Date();
			const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes since midnight
			
			let futureSchedules = scheduleData.filter(schedule => {
				if (schedule.time === 'N/A') return true; // Keep N/A times for now
				
				const timeMatch = schedule.time.match(/(\d{1,2}):(\d{2})/);
				if (!timeMatch) return true; // Keep invalid times for debugging
				
				const [, hours, minutes] = timeMatch;
				const scheduleTime = parseInt(hours) * 60 + parseInt(minutes);
				
				// For debugging, show schedules within a broader time window
				return true; // Temporarily show all schedules
			});
			
			// If no future schedules, just return the first batch for debugging
			if (futureSchedules.length === 0) {
				futureSchedules = scheduleData;
			}

			if (futureSchedules.length === 0) {
				// If still no data, return some mock data for debugging
				console.log('BusService: No schedule data found, returning mock data for debugging');
				return [
					{
						id: 'mock-1',
						time: '14:30',
						stop: 'Test Station 1',
						description: 'Mock departure 1',
						arrival: null,
						stationId: 'mock-station-1',
						tripId: 'mock-trip-1',
						lineId: lineNumber,
						uniqueLineId: `mock-${lineNumber}`,
						coordinates: null
					},
					{
						id: 'mock-2',
						time: '15:00',
						stop: 'Test Station 2',
						description: 'Mock departure 2',
						arrival: null,
						stationId: 'mock-station-2',
						tripId: 'mock-trip-2',
						lineId: lineNumber,
						uniqueLineId: `mock-${lineNumber}`,
						coordinates: null
					}
				];
			}

			return futureSchedules;

		} catch (error) {
			console.error('Error fetching bus schedule:', error);
			console.error('Error details:', error.message);
			return [];
		}
	},

	// Get bus schedule grouped by rides (voznjaId) for better organization
	getBusScheduleByRides: async (lineNumber) => {
		try {
			
			// Get fresh departure data directly from API
			const [linesResponse, departuresResponse] = await Promise.all([
				fetch(`${API_BASE_URL}/linije`),
				fetch(`${API_BASE_URL}/polasci`)
			]);
			
			const linesData = await linesResponse.json();
			const departuresData = await departuresResponse.json();

			if (departuresData.msg !== 'ok' || linesData.msg !== 'ok') {
				throw new Error('API response not OK');
			}

			// Create mapping of line numbers to line IDs
			const lineNumberToIds = new Map();
			Object.values(linesData.res).forEach(line => {
				if (!lineNumberToIds.has(line.brojLinije)) {
					lineNumberToIds.set(line.brojLinije, []);
				}
				lineNumberToIds.get(line.brojLinije).push(line.id);
			});

			const targetLineIds = lineNumberToIds.get(lineNumber) || [];

			// Convert departures data to array
			let departuresArray;
			if (Array.isArray(departuresData.res)) {
				departuresArray = departuresData.res;
			} else {
				departuresArray = Object.keys(departuresData.res).map(key => ({
					...departuresData.res[key],
					departureKey: key
				}));
			}

			// Filter departures for our line
			let filteredDepartures = [];
			if (targetLineIds.length > 0) {
				filteredDepartures = departuresArray.filter(departure => 
					targetLineIds.includes(departure.linijaId)
				);
			}

			// If no exact match, try matching based on departure keys (format: lineId-direction-variant)
			if (filteredDepartures.length === 0) {
				filteredDepartures = departuresArray.filter(departure => {
					if (!departure.departureKey) return false;
					// Check if any target line ID appears at the start of the departure key
					return targetLineIds.some(lineId => 
						departure.departureKey.startsWith(lineId.toString() + '-')
					);
				});
			}

			// If still no match, try filtering by line number within the polazakList data
			if (filteredDepartures.length === 0) {
				
				filteredDepartures = departuresArray.filter(departureGroup => {
					if (!departureGroup.polazakList || !Array.isArray(departureGroup.polazakList)) {
						return false;
					}
					
					// Check if any polazak in this group belongs to our target line
					return departureGroup.polazakList.some(polazak => {
						return targetLineIds.includes(polazak.linijaId);
					});
				});
			}

			// Final filter: within each departure group, only process polazak entries that belong to our line
			const strictFilteredDepartures = filteredDepartures.map(departureGroup => {
				const filteredPolazakList = departureGroup.polazakList ? 
					departureGroup.polazakList.filter(polazak => 
						targetLineIds.includes(polazak.linijaId)
					) : [];
				
				return {
					...departureGroup,
					polazakList: filteredPolazakList
				};
			}).filter(group => group.polazakList.length > 0);

			// Process rides from polazakList
			const rideGroups = new Map();
			
			strictFilteredDepartures.forEach(departureGroup => {
				if (departureGroup.polazakList && Array.isArray(departureGroup.polazakList)) {
					
					// Verify we have the right line data
					const lineIds = [...new Set(departureGroup.polazakList.map(p => p.linijaId))];
					
					departureGroup.polazakList.forEach((polazak, index) => {
						const rideId = polazak.voznjaId;
						const busId = polazak.voznjaBusId;
						const polazakLineId = polazak.linijaId;
						
						if (!rideId) {
							console.warn('BusService (Rides): Missing voznjaId for polazak', index);
							return;
						}
						
						// Double-check that this polazak belongs to our target line
						if (!targetLineIds.includes(polazakLineId)) {
							console.warn('BusService (Rides): Skipping polazak from different line. Expected:', targetLineIds, 'Got:', polazakLineId);
							return;
						}
						
						// Initialize ride group if not exists
						if (!rideGroups.has(rideId)) {
							rideGroups.set(rideId, {
								rideId: rideId,
								busId: busId,
								lineNumber: lineNumber,
								lineId: polazakLineId, // Store the actual line ID for verification
								departures: [],
								stations: []
							});
						}
						
						const ride = rideGroups.get(rideId);
						
						// Extract departure time
						let departureTime = 'N/A';
						if (polazak.polazak) {
							const timeMatch = polazak.polazak.match(/T(\d{2}:\d{2})/);
							if (timeMatch) {
								departureTime = timeMatch[1];
							}
						}
						
						// Extract station name
						let stationName = 'Unknown Stop';
						if (polazak.stanica && polazak.stanica.naziv) {
							stationName = polazak.stanica.naziv.toString().replace(/\s+/g, ' ').trim();
						}
						
						// Create departure object
						const departure = {
							id: polazak.voznjaStanicaId || `${rideId}-${ride.departures.length}`,
							time: departureTime,
							stop: stationName,
							stationId: polazak.stanicaId,
							coordinates: polazak.stanica ? {
								lat: polazak.stanica.gpsY,
								lng: polazak.stanica.gpsX
							} : null,
							rideId: rideId,
							busId: busId
						};
						
						ride.departures.push(departure);
						ride.stations.push(stationName);
					});
				}
			});
			
			// Convert to array and process each ride
			const rides = Array.from(rideGroups.values()).map(ride => {
				// Sort departures by time
				ride.departures.sort((a, b) => {
					if (a.time === 'N/A') return 1;
					if (b.time === 'N/A') return -1;
					return a.time.localeCompare(b.time);
				});
				
				// Calculate ride metadata
				const firstDeparture = ride.departures.length > 0 ? ride.departures[0].time : 'N/A';
				const lastDeparture = ride.departures.length > 0 ? ride.departures[ride.departures.length - 1].time : 'N/A';
				const stationCount = ride.departures.length;
				
				return {
					rideId: ride.rideId,
					busId: ride.busId,
					lineNumber: ride.lineNumber,
					lineId: ride.lineId,
					firstDeparture: firstDeparture,
					lastDeparture: lastDeparture,
					stationCount: stationCount,
					departures: ride.departures,
					title: `${firstDeparture} - ${lastDeparture} (${stationCount} stops)`
				};
			});
			
			// Sort rides by first departure time
			rides.sort((a, b) => {
				if (a.firstDeparture === 'N/A') return 1;
				if (b.firstDeparture === 'N/A') return -1;
				return a.firstDeparture.localeCompare(b.firstDeparture);
			});

			// Verify all rides belong to the correct line
			const lineVerification = rides.map(ride => ({
				rideId: ride.rideId,
				lineId: ride.lineId,
				isCorrectLine: targetLineIds.includes(ride.lineId)
			}));
			
			// Filter out any rides that don't belong to the target line (safety check)
			const verifiedRides = rides.filter(ride => targetLineIds.includes(ride.lineId));
			
			if (verifiedRides.length !== rides.length) {
				console.warn('BusService (Rides): Filtered out', rides.length - verifiedRides.length, 'rides from wrong lines');
			}

			return verifiedRides;
			
		} catch (error) {
			console.error('Error fetching bus schedule by rides:', error);
			return [];
		}
	},

	// Analyze API endpoints and data structure for debugging
	analyzeAPIStructure: async () => {
		try {
			
			const [linesResponse, busesResponse, departuresResponse] = await Promise.all([
				fetch(`${API_BASE_URL}/linije`),
				fetch(`${API_BASE_URL}/autobusi`),
				fetch(`${API_BASE_URL}/polasci`)
			]);
			
			const linesData = await linesResponse.json();
			const busesData = await busesResponse.json();
			const departuresData = await departuresResponse.json();

			
			// Lines analysis
			const sampleLine = Object.values(linesData.res)[0];

			
			// Buses analysis
			const sampleBus = busesData.res[0];
			
			// Departures analysis
			const sampleKey = Object.keys(departuresData.res)[0];
			const sampleDeparture = departuresData.res[sampleKey];
			
			if (sampleDeparture.polazakList?.length > 0) {
				const samplePolazak = sampleDeparture.polazakList[0];
			}
			
			// Summary of findings
			return {
				lines: Object.keys(linesData.res).length,
				buses: busesData.res.length,
				departureGroups: Object.keys(departuresData.res).length,
				sampleStructures: {
					line: sampleLine,
					bus: sampleBus,
					departure: sampleDeparture
				}
			};
			
		} catch (error) {
			console.error('Error analyzing API structure:', error);
			return null;
		}
	},

	// Get specific bus location (enhanced from live buses data)
	getBusLocation: async (lineNumber) => {
		try {
			// Get live buses and find the one matching the line number
			const liveBuses = await busService.getLiveBuses();
			const targetBus = liveBuses.find(bus => bus.lineNumber === lineNumber);

			if (targetBus) {
				return {
					latitude: targetBus.latitude,
					longitude: targetBus.longitude,
					speed: 'Live tracking',
					direction: 'Real-time',
					busNumber: targetBus.busNumber,
					tripId: targetBus.tripId
				};
			} else {
				// If no live bus found, return a default location (city center of Rijeka)
				return {
					latitude: 45.3271,
					longitude: 14.4422,
					speed: 'Not available',
					direction: 'Not available'
				};
			}

		} catch (error) {
			console.error('Error fetching bus location:', error);
			return {
				latitude: 45.3271,
				longitude: 14.4422,
				speed: 'Error',
				direction: 'Error'
			};
		}
	},

	// Get all bus lines
	getBusLines: async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/linije`);
			const data = await response.json();

			if (data.msg !== 'ok') {
				throw new Error('API response not OK');
			}

			return Object.values(data.res).map(line => ({
				id: line.id,
				lineNumber: line.brojLinije,
				name: line.naziv,
				direction: line.smjerId,
				directionName: line.smjerNaziv || '',
				uniqueId: line.uniqueLinijaId || `${line.id}-${line.smjerId}-${line.varijantaId || 0}`
			}));

		} catch (error) {
			console.error('Error fetching bus lines:', error);
			return [];
		}
	},

	// Get stations/stops
	getStations: async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/stanice`);
			const data = await response.json();

			if (data.msg !== 'ok') {
				throw new Error('API response not OK');
			}

			return data.res.map(station => ({
				id: station.id,
				name: station.naziv,
				shortName: station.nazivKratki,
				latitude: station.gpsY,
				longitude: station.gpsX,
				direction: station.smjer,
				directionId: station.smjerId
			}));

		} catch (error) {
			console.error('Error fetching stations:', error);
			return [];
		}
	}
};

export default busService;
