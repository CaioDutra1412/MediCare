import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    navigation.replace('Home'); 
  } catch (error) {
    Alert.alert('Erro', error.message);
  }
};


  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logoMediCare.png')} style={styles.logo} />
      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.subtitle}>Acesse sua conta MediCare</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Esqueci minha senha</Text>
      </TouchableOpacity>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <View style={styles.divider} />
      </View>
      <View style={styles.footerColumn}>
        <Text>Não tem uma conta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Registre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f8ff' },
  logo: { width: 250, height: 250, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a4db4', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 20 },
  input: { width: '100%', height: 44, backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e3e3e3' },
  button: { width: '100%', height: 44, backgroundColor: '#1a4db4', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#1a4db4', fontWeight: 'bold', marginTop: 8 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, width: '100%' },
  divider: { flex: 1, height: 1, backgroundColor: '#e3e3e3' },
  or: { marginHorizontal: 8, color: '#888' },
  googleButton: { width: '100%', height: 44, backgroundColor: '#fff', borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e3e3e3', marginBottom: 16 },
  googleButtonText: { color: '#222', fontWeight: 'bold' },
  footerColumn: { alignItems: 'center', marginTop: 12 },
});
