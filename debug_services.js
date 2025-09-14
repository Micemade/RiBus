/**
 * Simple debug script to test the bus services directly
 * This helps identify if the issue is with the cached service or the original API
 */

// Import both services for comparison
const busService = require('./src/services/busService.js');
const cachedBusService = require('./src/services/cachedBusService.js');

async function debugBusServices() {
    console.log('🔍 DEBUG: Testing both bus services...\n');
    
    try {
        // Test 1: Get live buses to find a test line
        console.log('1. Getting live buses...');
        const liveBuses = await busService.getLiveBuses();
        console.log(`   Found ${liveBuses.length} live buses`);
        
        if (liveBuses.length === 0) {
            console.log('❌ No live buses found. Cannot continue test.');
            return;
        }
        
        const testLine = liveBuses[0].lineNumber;
        console.log(`   Using line ${testLine} for testing\n`);
        
        // Test 2: Compare original vs cached service for getBusSchedule
        console.log('2. Testing getBusSchedule...');
        console.log('   Original busService:');
        const originalSchedule = await busService.getBusSchedule(testLine);
        console.log(`   → Returned ${originalSchedule.length} schedule entries`);
        
        console.log('   Cached busService:');
        const cachedSchedule = await cachedBusService.default.getBusSchedule(testLine);
        console.log(`   → Returned ${cachedSchedule.length} schedule entries\n`);
        
        // Test 3: Compare original vs cached service for getBusScheduleByRides  
        console.log('3. Testing getBusScheduleByRides...');
        console.log('   Original busService:');
        const originalRides = await busService.getBusScheduleByRides(testLine);
        console.log(`   → Returned ${originalRides.length} rides`);
        
        if (originalRides.length > 0) {
            console.log(`   → Sample ride:`, {
                rideId: originalRides[0].rideId,
                title: originalRides[0].title,
                stationCount: originalRides[0].stationCount
            });
        }
        
        console.log('   Cached busService:');
        const cachedRides = await cachedBusService.default.getBusScheduleByRides(testLine);
        console.log(`   → Returned ${cachedRides.length} rides`);
        
        if (cachedRides.length > 0) {
            console.log(`   → Sample ride:`, {
                rideId: cachedRides[0].rideId,
                title: cachedRides[0].title,
                stationCount: cachedRides[0].stationCount
            });
        }
        
        // Summary
        console.log('\n📊 SUMMARY:');
        console.log(`Schedule - Original: ${originalSchedule.length}, Cached: ${cachedSchedule.length}`);
        console.log(`Rides - Original: ${originalRides.length}, Cached: ${cachedRides.length}`);
        
        if (originalRides.length > 0 && cachedRides.length === 0) {
            console.log('❌ ISSUE FOUND: Original service returns rides, but cached service returns empty array!');
        } else if (originalRides.length === 0) {
            console.log('⚠️  API Issue: Original service is also returning no rides');
        } else {
            console.log('✅ Both services are working correctly');
        }
        
    } catch (error) {
        console.error('❌ Debug test failed:', error);
    }
}

// Run the debug
debugBusServices();
