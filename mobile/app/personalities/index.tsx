// Place this template inside BOTH:
// app/login/index.tsx AND app/personalities/index.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../_layout';

export default function ConfigPlaceholder() {
  return (
    <View style={styles.center}>
      <Text style={{ color: '#fff', fontSize: 12 }}>Onboarding Config Pipeline Route Placeholder View Node</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: THEME.canvas, justifyContent: 'center', alignItems: 'center' }
});