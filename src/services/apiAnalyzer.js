// API Data Structure Analyzer for debugging rides and schedules

const API_BASE_URL = 'https://cors-anywhere.herokuapp.com/https://app.autotrolej.hr/servisi';

const analyzeAPIData = async () => {
    try {
        console.log('🔍 Starting comprehensive API analysis...');
        
        // Fetch all API endpoints
        const [linesResponse, busesResponse, departuresResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/linije`),
            fetch(`${API_BASE_URL}/autobusi`),
            fetch(`${API_BASE_URL}/polasci`)
        ]);
        
        const linesData = await linesResponse.json();
        const busesData = await busesResponse.json();
        const departuresData = await departuresResponse.json();
        
        console.log('📊 API Response Status:');
        console.log('- Lines:', linesData.msg);
        console.log('- Buses:', busesData.msg);
        console.log('- Departures:', departuresData.msg);
        
        // Analyze lines structure
        console.log('\n🚌 LINES ANALYSIS:');
        const lines = Object.values(linesData.res);
        console.log('Total lines:', lines.length);
        console.log('Sample line:', JSON.stringify(lines[0], null, 2));
        
        // Get line numbers available
        const lineNumbers = [...new Set(lines.map(line => line.brojLinije))].sort();
        console.log('Available line numbers:', lineNumbers.slice(0, 10));
        
        // Analyze departures structure
        console.log('\n⏰ DEPARTURES ANALYSIS:');
        let departuresArray;
        if (Array.isArray(departuresData.res)) {
            departuresArray = departuresData.res;
        } else {
            departuresArray = Object.keys(departuresData.res).map(key => ({
                ...departuresData.res[key],
                departureKey: key
            }));
        }
        
        console.log('Total departure groups:', departuresArray.length);
        console.log('Sample departure group:', JSON.stringify(departuresArray[0], null, 2));
        
        // Analyze polazakList structure
        if (departuresArray[0] && departuresArray[0].polazakList) {
            console.log('\n📍 POLAZAK LIST ANALYSIS:');
            const samplePolazakList = departuresArray[0].polazakList;
            console.log('Sample polazakList length:', samplePolazakList.length);
            console.log('Sample polazak entry:', JSON.stringify(samplePolazakList[0], null, 2));
            
            // Analyze ride grouping
            const voznjaIds = new Set();
            const voznjaBusIds = new Set();
            const stanicaNames = new Set();
            
            departuresArray.slice(0, 5).forEach(group => {
                if (group.polazakList) {
                    group.polazakList.forEach(polazak => {
                        if (polazak.voznjaId) voznjaIds.add(polazak.voznjaId);
                        if (polazak.voznjaBusId) voznjaBusIds.add(polazak.voznjaBusId);
                        if (polazak.stanica && polazak.stanica.naziv) {
                            stanicaNames.add(polazak.stanica.naziv);
                        }
                    });
                }
            });
            
            console.log('Unique voznjaIds (rides):', Array.from(voznjaIds).slice(0, 10));
            console.log('Unique voznjaBusIds:', Array.from(voznjaBusIds).slice(0, 10));
            console.log('Sample station names:', Array.from(stanicaNames).slice(0, 10));
        }
        
        // Analyze specific line (let's use line 2 as example)
        console.log('\n🎯 SPECIFIC LINE ANALYSIS (Line 2):');
        const targetLineNumber = '2';
        
        // Find line data for line 2
        const line2Data = lines.filter(line => line.brojLinije === targetLineNumber);
        console.log('Line 2 data entries:', line2Data.length);
        if (line2Data.length > 0) {
            console.log('Line 2 sample:', JSON.stringify(line2Data[0], null, 2));
        }
        
        // Find departures for line 2
        const line2Ids = line2Data.map(line => line.id);
        console.log('Line 2 IDs:', line2Ids);
        
        const line2Departures = departuresArray.filter(departure => 
            line2Ids.includes(departure.linijaId)
        );
        console.log('Line 2 departure groups:', line2Departures.length);
        
        if (line2Departures.length > 0) {
            console.log('Line 2 sample departure group:', JSON.stringify(line2Departures[0], null, 2));
            
            // Analyze rides for line 2
            const line2Rides = new Map();
            line2Departures.forEach(group => {
                if (group.polazakList) {
                    group.polazakList.forEach(polazak => {
                        const rideId = polazak.voznjaId;
                        if (!line2Rides.has(rideId)) {
                            line2Rides.set(rideId, []);
                        }
                        line2Rides.get(rideId).push(polazak);
                    });
                }
            });
            
            console.log('Line 2 rides count:', line2Rides.size);
            console.log('Line 2 ride IDs:', Array.from(line2Rides.keys()).slice(0, 5));
            
            // Analyze a specific ride
            const firstRideId = Array.from(line2Rides.keys())[0];
            if (firstRideId) {
                const firstRide = line2Rides.get(firstRideId);
                console.log(`Ride ${firstRideId} stations count:`, firstRide.length);
                console.log(`Ride ${firstRideId} first station:`, {
                    time: firstRide[0].polazak,
                    station: firstRide[0].stanica?.naziv,
                    busId: firstRide[0].voznjaBusId
                });
                console.log(`Ride ${firstRideId} last station:`, {
                    time: firstRide[firstRide.length - 1].polazak,
                    station: firstRide[firstRide.length - 1].stanica?.naziv,
                    busId: firstRide[firstRide.length - 1].voznjaBusId
                });
            }
        }
        
        console.log('\n✅ API Analysis Complete');
        return {
            linesCount: lines.length,
            departureGroupsCount: departuresArray.length,
            availableLineNumbers: lineNumbers,
            sampleData: {
                line: lines[0],
                departure: departuresArray[0],
                polazak: departuresArray[0]?.polazakList?.[0]
            }
        };
        
    } catch (error) {
        console.error('❌ Error analyzing API:', error);
        return null;
    }
};

module.exports = { analyzeAPIData };
