import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '../_layout';

const INITIAL_SCHEDULE = [
  { id: '1', time: '7:00 PM', title: 'Algebra Review', sub: '30 min · Visual mode', peak: true },
  { id: '2', time: '8:00 PM', title: 'Science: Cells', sub: '45 min', peak: false }
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Hero Header Card Layout */}
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>🧬 DNA ACTIVE</Text>
        <Text style={styles.heroTitle}>Magandang gabi, Syril! 👋</Text>
        <Text style={styles.heroDesc}>Peak energy 7–9 PM detected. Visual learner mode on. Let's make progress tonight!</Text>
        <View style={styles.pillContainer}>
          <View style={[styles.pill, { backgroundColor: 'rgba(139,92,246,0.18)' }]}><Text style={{ color: '#C4B5FD', fontSize: 8 }}>Visual</Text></View>
          <View style={[styles.pill, { backgroundColor: THEME.pinkBg }]}><Text style={{ color: THEME.pinkText, fontSize: 8 }}>❤️ Caring</Text></View>
        </View>
      </View>

      {/* Lexa Sticky Quick Strip Component Banner */}
      <View style={styles.coachStrip}>
        <View style={styles.csAv}><View style={styles.csAvHead} /><View style={styles.csAvBody} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.csName}>Lexa says:</Text>
          <Text style={styles.csMsg}>You're doing great! 2 topics left in Algebra. No rush 😊</Text>
        </View>
        <TouchableOpacity style={styles.csBtn} onPress={() => router.push('/chat')}>
          <Text style={styles.csBtnText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Columns Box */}
      <View style={styles.row}>
        <View style={[styles.cardSm, { flex: 1 }]}>
          <Text style={styles.statLabel}>Today's goal</Text>
          <Text style={styles.statVal}>2h</Text>
          <Text style={styles.statSub}>1.2h done · 60%</Text>
          <View style={styles.pb}><View style={[styles.pf, { width: '60%' }]} /></View>
        </View>
        <View style={[styles.cardSm, { flex: 1 }]}>
          <Text style={styles.statLabel}>XP Points</Text>
          <Text style={styles.statVal}>2,350</Text>
          <Text style={styles.statSub}>🔥 12-day streak</Text>
        </View>
      </View>

      {/* Today's Schedule Target List */}
      <View style={styles.card}>
        <Text style={styles.sectTitle}>Today's Schedule</Text>
        {INITIAL_SCHEDULE.map(item => (
          <View key={item.id} style={styles.schedRow}>
            <Text style={styles.schedTime}>{item.time}</Text>
            <View style={[styles.schedDot, { backgroundColor: item.peak ? THEME.primary : THEME.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.schedTtl}>{item.title}</Text>
              <Text style={styles.schedSub}>{item.sub}</Text>
            </View>
            {item.peak && <View style={[styles.pill, { backgroundColor: 'rgba(139,92,246,0.18)' }]}><Text style={{ color: '#C4B5FD', fontSize: 8 }}>Now</Text></View>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.canvas },
  scrollContent: { padding: 12, gap: 10, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 8 },
  pillContainer: { flexDirection: 'row', gap: 4, marginTop: 7 },
  card: { backgroundColor: THEME.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardSm: { backgroundColor: THEME.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  hero: { backgroundColor: THEME.accentPurple, borderRadius: 14, padding: 14 },
  heroEyebrow: { fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, fontWeight: 'bold', marginBottom: 4 },
  heroTitle: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 3 },
  heroDesc: { fontSize: 9, color: 'rgba(255,255,255,0.55)', lineHeight: 14 },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  coachStrip: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)', borderRadius: 12 },
  csAv: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: THEME.primaryLight, overflow: 'hidden' },
  csAvHead: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: -2 },
  csAvBody: { width: 22, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  csName: { fontSize: 10, fontWeight: '500', color: '#fff' },
  csMsg: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  csBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, backgroundColor: THEME.primary },
  csBtnText: { color: '#fff', fontSize: 9 },
  statLabel: { fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  statVal: { fontSize: 17, fontWeight: '600', color: '#fff' },
  statSub: { fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  pb: { height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, marginTop: 6 },
  pf: { height: 4, backgroundColor: THEME.primary, borderRadius: 2 },
  sectTitle: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500', marginBottom: 8 },
  schedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  schedTime: { fontSize: 8, color: 'rgba(255,255,255,0.3)', minWidth: 38 },
  schedDot: { width: 6, height: 6, borderRadius: 3 },
  schedTtl: { fontSize: 10, color: '#fff' },
  schedSub: { fontSize: 8, color: 'rgba(255,255,255,0.35)' },
});