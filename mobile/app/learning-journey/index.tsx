import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { THEME } from '../_layout';

const INITIAL_JOURNEY = [
  { id: '1', title: 'Algebra Basics', sub: 'Quiz score: 92%', marker: '✓', status: 'done', week: 'Wk 1' },
  { id: '2', title: 'Functions', sub: 'Quiz score: 85%', marker: '✓', status: 'done', week: 'Wk 2' },
  { id: '3', title: 'Quadratic Equations', sub: 'In progress · 48%', marker: '→', status: 'active', week: 'Wk 3' }
];

export default function JourneyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '500' }}>Mathematics Path</Text>
        <View style={styles.pb}><View style={[styles.pf, { width: '60%' }]} /></View>
        <Text style={{ color: THEME.textMuted, fontSize: 8, marginTop: 4 }}>60% complete</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectTitle}>Your path mapping milestone</Text>
        {INITIAL_JOURNEY.map(step => (
          <View key={step.id} style={styles.journeyStep}>
            <View style={[styles.jDot, { backgroundColor: step.status === 'done' ? THEME.greenBg : step.status === 'active' ? THEME.primary : 'rgba(255,255,255,0.06)' }]}>
              <Text style={{ color: step.status === 'done' ? THEME.green : '#fff', fontSize: 9 }}>{step.marker}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.jTitle, step.status === 'active' && { color: THEME.primaryLight }]}>{step.title}</Text>
              <Text style={styles.jSub}>{step.sub}</Text>
            </View>
            <Text style={styles.jWeek}>{step.week}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.canvas },
  scrollContent: { padding: 12, gap: 10, paddingBottom: 40 },
  card: { backgroundColor: THEME.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  pb: { height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, marginTop: 6 },
  pf: { height: 4, backgroundColor: THEME.primary, borderRadius: 2 },
  sectTitle: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500', marginBottom: 8 },
  journeyStep: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  jDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  jTitle: { fontSize: 10, color: '#fff' },
  jSub: { fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  jWeek: { fontSize: 8, color: 'rgba(255,255,255,0.3)' },
});