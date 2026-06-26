import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { THEME } from "@/constants/theme";

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'ai', text: 'Hoy Syril! 👋 Visual learner ka diba? So let\'s use diagrams today. Anong topic — Algebra o Science? 🤔' },
    { id: '2', sender: 'user', text: 'Algebra please. Hindi ko gets yung quadratic formula.' }
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={[styles.msgWrapper, item.sender === 'user' ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
            {item.sender === 'ai' && <Text style={styles.msgName}>Lexa ❤️</Text>}
            <View style={[styles.bubble, item.sender === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
              <Text style={{ color: '#fff', fontSize: 10, lineHeight: 14 }}>{item.text}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.inputField}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask in Taglish..."
          placeholderTextColor="rgba(255,255,255,0.25)"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.canvas },
  msgWrapper: { maxWidth: '85%', marginBottom: 8 },
  msgName: { fontSize: 7, color: 'rgba(255,255,255,0.3)', marginBottom: 2 },
  bubble: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10 },
  bubbleAi: { backgroundColor: '#1E1A40', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  bubbleUser: { backgroundColor: THEME.primary },
  chatInputContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, backgroundColor: THEME.topbar, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', padding: 10, gap: 6, alignItems: 'center' },
  inputField: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 10, height: 36, color: '#fff', fontSize: 9 },
  sendBtn: { backgroundColor: THEME.primary, borderRadius: 7, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});