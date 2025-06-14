import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

function getInitials(nome) {
  return nome
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

export default function DoctorsScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    especialidade: '',
    hospital: '',
    telefone: '',
  });

  // Carrega médicos em tempo real
  useEffect(() => {
    const q = query(collection(db, 'doctors'), orderBy('nome'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctors(list);
    });
    return unsubscribe;
  }, []);

  // Filtro de busca
  useEffect(() => {
    if (!search) setFilteredDoctors(doctors);
    else {
      const s = search.toLowerCase();
      setFilteredDoctors(
        doctors.filter(
          d =>
            d.nome.toLowerCase().includes(s) ||
            d.especialidade.toLowerCase().includes(s) ||
            d.hospital.toLowerCase().includes(s)
        )
      );
    }
  }, [search, doctors]);

  // Abrir modal para adicionar ou editar
  const openModal = (doctor = null) => {
    setEditingDoctor(doctor);
    setForm(
      doctor
        ? {
            nome: doctor.nome,
            especialidade: doctor.especialidade,
            hospital: doctor.hospital,
            telefone: doctor.telefone || '',
          }
        : { nome: '', especialidade: '', hospital: '', telefone: '' }
    );
    setModalVisible(true);
  };

  // Salvar novo médico ou editar existente
  const handleSave = async () => {
    if (!form.nome || !form.especialidade || !form.hospital) {
      Alert.alert('Preencha todos os campos obrigatórios.');
      return;
    }
    try {
      if (editingDoctor) {
        await updateDoc(doc(db, 'doctors', editingDoctor.id), {
          nome: form.nome,
          especialidade: form.especialidade,
          hospital: form.hospital,
          telefone: form.telefone,
        });
      } else {
        await addDoc(collection(db, 'doctors'), {
          nome: form.nome,
          especialidade: form.especialidade,
          hospital: form.hospital,
          telefone: form.telefone,
        });
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Erro ao salvar médico.');
    }
  };

  // Excluir médico
  const handleDelete = async id => {
    Alert.alert('Excluir médico?', 'Tem certeza que deseja excluir este médico?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'doctors', id));
          } catch (e) {
            Alert.alert('Erro ao excluir médico.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Médicos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Campo de busca */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar médicos..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Lista de médicos */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>
            Nenhum médico encontrado.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials(item.nome)}</Text>
              </View>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{item.nome}</Text>
              <Text style={styles.specialty}>{item.especialidade}</Text>
              <Text style={styles.hospital}>{item.hospital}</Text>
              {item.telefone ? (
                <Text style={styles.phone}>Tel: {item.telefone}</Text>
              ) : null}
            </View>
            <View style={styles.actionsColumn}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openModal(item)}>
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#e74c3c" style={{ marginTop: 12 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal de adicionar/editar médico */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDoctor ? 'Editar Médico' : 'Adicionar Médico'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome"
              value={form.nome}
              onChangeText={text => setForm({ ...form, nome: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Especialidade"
              value={form.especialidade}
              onChangeText={text => setForm({ ...form, especialidade: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Hospital/Clínica"
              value={form.hospital}
              onChangeText={text => setForm({ ...form, hospital: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Telefone (opcional)"
              value={form.telefone}
              onChangeText={text => setForm({ ...form, telefone: text })}
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingDoctor ? 'Salvar' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#222' },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#192a56',
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 4 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      marginHorizontal: 12,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#eee',
      height: 40,
    },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  avatarContainer: { marginRight: 14 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3478f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  infoContainer: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 15, color: '#222' },
  specialty: { color: '#3478f6', fontSize: 13, marginTop: 2 },
  hospital: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  phone: { color: '#888', fontSize: 12, marginTop: 2 },
  actionsColumn: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  editBtn: {
    backgroundColor: '#f6f8fd',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { color: '#192a56', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    elevation: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: 6,
    backgroundColor: '#f7f8fa',
    padding: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, backgroundColor: '#f7f8fa', marginRight: 8 },
  cancelButtonText: { color: '#222', fontWeight: 'bold', fontSize: 15 },
  saveButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, backgroundColor: '#3478f6' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
