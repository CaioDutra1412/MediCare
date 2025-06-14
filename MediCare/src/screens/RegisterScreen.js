import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  const handleRegister = async () => {
    console.log('Tentando registrar:', { nome, email, senha, confirmaSenha });

    if (senha !== confirmaSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      console.log('As senhas não coincidem.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      console.log('Usuário criado:', userCredential.user);

      // Salva o nome e dados iniciais no Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        nome,
        telefone: '',
        tipoSanguineo: '',
        alergias: '',
        contatoEmergencia: ''
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      navigation.navigate('Login');
    } catch (error) {
      console.log('Erro ao criar conta:', error);
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={{ color: '#1a4db4', fontWeight: 'bold' }}>← Voltar</Text>
      </TouchableOpacity>
      <Image source={require('../../assets/logoMediCare.png')} style={styles.logo} />
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Junte-se ao MediCare</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={nome}
        onChangeText={setNome}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Confirmar senha"
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Criar Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f8ff' },
  back: { position: 'absolute', top: 40, left: 20 },
  logo: { width: 250, height: 250, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a4db4', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 20 },
  input: { width: '100%', height: 44, backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e3e3e3' },
  button: { width: '100%', height: 44, backgroundColor: '#1a4db4', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
