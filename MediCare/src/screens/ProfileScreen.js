import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ProfileScreen({ navigation }) {
  const [editando, setEditando] = useState(false);
  const [profile, setProfile] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipoSanguineo: '',
    alergias: '',
    contatoEmergencia: ''
  });
  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setProfile(prev => ({ ...prev, email: user.email }));
      const fetchProfile = async () => {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setProfile({ email: user.email, ...docSnap.data() });
        }
      };
      fetchProfile();
    }
  }, []);

  const handleEdit = () => {
    setDraft(profile);
    setEditando(true);
  };

  const handleCancel = () => {
    setEditando(false);
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, 'users', user.uid), {
        nome: draft.nome,
        telefone: draft.telefone,
        tipoSanguineo: draft.tipoSanguineo,
        alergias: draft.alergias,
        contatoEmergencia: draft.contatoEmergencia
      });
      setProfile({ ...profile, ...draft });
      setEditando(false);
      Alert.alert('Perfil atualizado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fafbfc' }}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={handleEdit} disabled={editando}>
          <Ionicons name="create-outline" size={24} color="#222" />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={56} color="#fff" />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nome</Text>
          {editando ? (
            <TextInput
              style={styles.input}
              value={draft.nome}
              onChangeText={text => setDraft({ ...draft, nome: text })}
            />
          ) : (
            <Text style={styles.value}>{profile.nome}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Telefone</Text>
          {editando ? (
            <TextInput
              style={styles.input}
              value={draft.telefone}
              onChangeText={text => setDraft({ ...draft, telefone: text })}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{profile.telefone}</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informações Médicas</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tipo Sanguíneo</Text>
          {editando ? (
            <TextInput
              style={styles.input}
              value={draft.tipoSanguineo}
              onChangeText={text => setDraft({ ...draft, tipoSanguineo: text })}
            />
          ) : (
            <Text style={styles.value}>{profile.tipoSanguineo}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Alergias</Text>
          {editando ? (
            <TextInput
              style={styles.input}
              value={draft.alergias}
              onChangeText={text => setDraft({ ...draft, alergias: text })}
            />
          ) : (
            <Text style={styles.value}>{profile.alergias}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Contato de Emergência</Text>
          {editando ? (
            <TextInput
              style={styles.input}
              value={draft.contatoEmergencia}
              onChangeText={text => setDraft({ ...draft, contatoEmergencia: text })}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{profile.contatoEmergencia}</Text>
          )}
        </View>
      </View>

      {editando ? (
        <View style={styles.editButtonsRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  avatarContainer: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#3478f6', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 12, marginVertical: 8, padding: 16, elevation: 1 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#222' },
  infoRow: { marginBottom: 12 },
  label: { color: '#222', fontWeight: 'bold', fontSize: 14 },
  value: { color: '#444', fontSize: 14, marginTop: 2 },
  input: { backgroundColor: '#f7f8fa', borderRadius: 6, padding: 8, marginTop: 2, borderWidth: 1, borderColor: '#e3e3e3', fontSize: 14 },
  logoutButton: { margin: 16, borderWidth: 1, borderColor: '#e74c3c', borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  logoutButtonText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 16 },
  editButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 16 },
  cancelButton: { flex: 1, marginRight: 8, backgroundColor: '#f7f8fa', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { color: '#222', fontWeight: 'bold', fontSize: 16 },
  saveButton: { flex: 1, marginLeft: 8, backgroundColor: '#3478f6', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
