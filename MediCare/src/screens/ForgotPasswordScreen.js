import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Sucesso', 'Email de recuperação enviado!');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={{ color: '#1a4db4', fontWeight: 'bold' }}>← Voltar</Text>
      </TouchableOpacity>
      <Image source={require('../../assets/logoMediCare.png')} style={styles.logo} />
      <Text style={styles.title}>Recuperar Senha</Text>
      <Text style={styles.subtitle}>Digite seu email para receber as instruções de recuperação de senha</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite seu email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Enviar Instruções</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Lembrou da senha? Fazer Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f8ff' },
  back: { position: 'absolute', top: 40, left: 20 },
  logo: { width: 250, height: 250, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a4db4', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 20, textAlign: 'center' },
  input: { width: '100%', height: 44, backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e3e3e3' },
  button: { width: '100%', height: 44, backgroundColor: '#1a4db4', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#1a4db4', fontWeight: 'bold', marginTop: 16 },
});
