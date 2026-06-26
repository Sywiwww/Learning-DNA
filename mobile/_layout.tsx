import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

export const THEME = {
  bg: '#0A0914',
  canvas: '#0D0B1E',
  card: '#16123A',
  topbar: '#130F2A',
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  accentPurple: '#2D1B6B',
  green: '#34D399',
  greenBg: 'rgba(34, 197, 94, 0.15)',
  pinkText: '#F9A8D4',
  pinkBg: 'rgba(236, 72, 153, 0.15)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
};

export default function RootLayout() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.rootSafeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.topbar} />
      
      {/* Global Application Top Bar */}
      <View style={styles.topbarLayout}>
        <Text style={styles.logoMark}>🧬</Text>
        <Text style={styles.topbarTitle}>Learning<Text style={{ color: THEME.primaryLight }}>DNA</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.indicatorPill, isOnline ? styles.pillOnline : styles.pillOffline]}>
            <Text style={styles.indicatorPillText}>{isOnline ? "Online" : "Cached"}</Text>
          </View>
          <View style={styles.tbAv}><Text style={{ color: '#fff', fontSize: 8 }}>SY</Text></View>
        </View>
      </View>

      {/* Expo Router Managed Tab View Viewports */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.nativeNavbar,
          tabBarActiveTintColor: THEME.primaryLight,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
          tabBarLabelStyle: { fontSize: 8, paddingBottom: 4 },
        }}
      >
        <Tabs.Screen name="dashboard/index" options={{ title: 'Home' }} />
        <Tabs.Screen name="chat/index" options={{ title: 'Lexa' }} />
        <Tabs.Screen name="learning-journey/index" options={{ title: 'Journey' }} />
        
        {/* Hiding configuration utility routes from bottom tab strip bar */}
        <Tabs.Screen name="login/index" options={{ href: null }} />
        <Tabs.Screen name="personalities/index" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootSafeArea: { flex: 1, backgroundColor: THEME.bg },
  topbarLayout: { height: 54, backgroundColor: THEME.topbar, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  logoMark: { fontSize: 13 },
  topbarTitle: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  tbAv: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: THEME.primaryLight },
  indicatorPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pillOnline: { backgroundColor: 'rgba(34,197,94,0.15)' },
  pillOffline: { backgroundColor: 'rgba(239,68,68,0.15)' },
  indicatorPillText: { fontSize: 8, fontWeight: '600', color: '#86EFAC' },
  nativeNavbar: { backgroundColor: THEME.topbar, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', height: 60 },
});