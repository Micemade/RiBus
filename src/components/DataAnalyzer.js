import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import busService from '../services/busService';

const DataAnalyzer = ({ lineNumber = '2' }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const runAnalysis = async () => {
    setLoading(true);
    try {
      console.log('🔍 DataAnalyzer: Starting analysis for line', lineNumber);
      
      // Get raw schedule data
      const scheduleData = await busService.getBusSchedule(lineNumber);
      console.log('DataAnalyzer: Got', scheduleData.length, 'schedule entries');
      
      // Get rides data
      const ridesData = await busService.getBusScheduleByRides(lineNumber);
      console.log('DataAnalyzer: Got', ridesData.length, 'rides');
      
      // Analyze the structure
      const analysisResult = {
        lineNumber: lineNumber,
        scheduleCount: scheduleData.length,
        ridesCount: ridesData.length,
        sampleSchedule: scheduleData[0] || null,
        sampleRide: ridesData[0] || null,
        scheduleStops: scheduleData.slice(0, 10).map(s => s.stop).filter(Boolean),
        rideTimes: ridesData.slice(0, 5).map(r => ({
          rideId: r.rideId,
          firstDeparture: r.firstDeparture,
          stationCount: r.stationCount,
          sampleStops: r.departures ? r.departures.slice(0, 3).map(d => d.stop) : []
        })),
        scheduleByRide: {}
      };
      
      // Group schedule by ride ID
      scheduleData.forEach(schedule => {
        const rideId = schedule.rideId || schedule.tripId || 'unknown';
        if (!analysisResult.scheduleByRide[rideId]) {
          analysisResult.scheduleByRide[rideId] = [];
        }
        analysisResult.scheduleByRide[rideId].push(schedule);
      });
      
      console.log('DataAnalyzer: Analysis complete:', analysisResult);
      setAnalysis(analysisResult);
      
    } catch (error) {
      console.error('DataAnalyzer: Error during analysis:', error);
      setAnalysis({ error: error.message });
    }
    setLoading(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderSection = (title, content, sectionKey) => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
      >
        <Text style={styles.sectionTitle}>
          {expandedSections[sectionKey] ? '▼' : '▶'} {title}
        </Text>
      </TouchableOpacity>
      {expandedSections[sectionKey] && (
        <View style={styles.sectionContent}>
          <Text style={styles.contentText}>{content}</Text>
        </View>
      )}
    </View>
  );

  useEffect(() => {
    runAnalysis();
  }, [lineNumber]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Analyzing Data Structure...</Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Analysis Data</Text>
        <TouchableOpacity style={styles.button} onPress={runAnalysis}>
          <Text style={styles.buttonText}>Run Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (analysis.error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Analysis Error</Text>
        <Text style={styles.errorText}>{analysis.error}</Text>
        <TouchableOpacity style={styles.button} onPress={runAnalysis}>
          <Text style={styles.buttonText}>Retry Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Data Analysis - Line {analysis.lineNumber}</Text>
      
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Schedule Entries: {analysis.scheduleCount}</Text>
        <Text style={styles.summaryText}>Rides Found: {analysis.ridesCount}</Text>
        <Text style={styles.summaryText}>Unique Ride Groups: {Object.keys(analysis.scheduleByRide).length}</Text>
      </View>

      {renderSection(
        'Sample Schedule Entry',
        JSON.stringify(analysis.sampleSchedule, null, 2),
        'sampleSchedule'
      )}

      {renderSection(
        'Sample Ride Data',
        JSON.stringify(analysis.sampleRide, null, 2),
        'sampleRide'
      )}

      {renderSection(
        'Schedule Stops (First 10)',
        analysis.scheduleStops.join('\n'),
        'scheduleStops'
      )}

      {renderSection(
        'Ride Times Analysis',
        analysis.rideTimes.map(ride => 
          `Ride ${ride.rideId}: ${ride.firstDeparture} (${ride.stationCount} stops)\nStops: ${ride.sampleStops.join(', ')}`
        ).join('\n\n'),
        'rideTimes'
      )}

      {renderSection(
        'Schedule Grouped By Ride',
        Object.keys(analysis.scheduleByRide).map(rideId => 
          `Ride ${rideId}: ${analysis.scheduleByRide[rideId].length} entries`
        ).join('\n'),
        'scheduleByRide'
      )}

      <TouchableOpacity style={styles.button} onPress={runAnalysis}>
        <Text style={styles.buttonText}>Refresh Analysis</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  summary: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 5,
  },
  section: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#007AFF',
    padding: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContent: {
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  contentText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default DataAnalyzer;
