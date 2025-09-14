/**
 * Quick test to verify cachedBusService methods are working
 * Run this from your terminal to test the cached service
 */

import cachedBusService from '../src/services/cachedBusService.js';

async function testCachedBusService() {
    console.log('🧪 Testing CachedBusService...');
    
    try {
        // Test getLiveBuses
        console.log('\n1. Testing getLiveBuses...');
        const liveBuses = await cachedBusService.getLiveBuses();
        console.log(`✓ getLiveBuses returned ${liveBuses.length} buses`);
        
        if (liveBuses.length > 0) {
            const testLine = liveBuses[0].lineNumber;
            console.log(`\n2. Testing getBusSchedule for line ${testLine}...`);
            const schedule = await cachedBusService.getBusSchedule(testLine);
            console.log(`✓ getBusSchedule returned ${schedule.length} schedule entries`);
            
            console.log(`\n3. Testing getBusScheduleByRides for line ${testLine}...`);
            const rides = await cachedBusService.getBusScheduleByRides(testLine);
            console.log(`✓ getBusScheduleByRides returned ${rides.length} rides`);
            
            if (rides.length === 0) {
                console.log('⚠️  No rides found - this might be the issue!');
                console.log('📊 Sample schedule data:', JSON.stringify(schedule.slice(0, 2), null, 2));
            } else {
                console.log('🎉 Rides are working!');
                console.log('📊 Sample ride data:', JSON.stringify(rides.slice(0, 1), null, 2));
            }
        } else {
            console.log('⚠️  No live buses found - API might be down');
        }
        
        // Test data readiness
        console.log('\n4. Testing data readiness...');
        const readiness = cachedBusService.getDataReadiness();
        console.log('📊 Data readiness:', readiness);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testCachedBusService();
