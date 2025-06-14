import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';

export default function MedicationsScreen({ navigation }) {
  const [medications, setMedications] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    dosagem: '',
    frequencia: '',
    prescritoPor: '',
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, 'medications'),
      where('userId', '==', user.uid),
      orderBy('nome')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedications(list);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!search) setFiltered(medications);
    else {
      const s = search.toLowerCase();
      setFiltered(
        medications.filter(
          m =>
            m.nome.toLowerCase().includes(s) ||
            m.dosagem.toLowerCase().includes(s) ||
            m.frequencia.toLowerCase().includes(s) ||
            (m.prescritoPor || '').toLowerCase().includes(s)
        )
      );
    }
  }, [search, medications]);

  const openModal = (med = null) => {
    setEditing(med);
    setForm(
      med
        ? {
            nome: med.nome,
            dosagem: med.dosagem,
            frequencia: med.frequencia,
            prescritoPor: med.prescritoPor || '',
          }
        : { nome: '', dosagem: '', frequencia: '', prescritoPor: '' }
    );
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.dosagem || !form.frequencia) {
      Alert.alert('Preencha todos os campos obrigatórios.');
      return;
    }
    try {
      const user = auth.currentUser;
      if (editing) {
        await updateDoc(doc(db, 'medications', editing.id), {
          nome: form.nome,
          dosagem: form.dosagem,
          frequencia: form.frequencia,
          prescritoPor: form.prescritoPor,
        });
      } else {
        await addDoc(collection(db, 'medications'), {
          nome: form.nome,
          dosagem: form.dosagem,
          frequencia: form.frequencia,
          prescritoPor: form.prescritoPor,
          userId: user.uid,
        });
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Erro ao salvar medicamento.');
    }
  };

  const handleDelete = async id => {
    Alert.alert('Excluir medicamento?', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'medications', id));
          } catch (e) {
            Alert.alert('Erro ao excluir medicamento.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicamentos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar medicamento..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>
            Nenhum medicamento encontrado.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardLine}>Dosagem: <Text style={styles.cardBold}>{item.dosagem}</Text></Text>
              <Text style={styles.cardLine}>Frequência: <Text style={styles.cardBold}>{item.frequencia}</Text></Text>
              {item.prescritoPor ? (
                <Text style={styles.cardPrescrito}>Prescrito por: {item.prescritoPor}</Text>
              ) : null}
            </View>
            <View style={styles.cardActions}>
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

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editing ? 'Editar Medicamento' : 'Novo Medicamento'}
            </Text>
            <Text style={styles.modalLabel}>Nome do Medicamento *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Losartana 50mg"
              value={form.nome}
              onChangeText={text => setForm({ ...form, nome: text })}
            />
            <Text style={styles.modalLabel}>Dosagem *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 50mg"
              value={form.dosagem}
              onChangeText={text => setForm({ ...form, dosagem: text })}
            />
            <Text style={styles.modalLabel}>Frequência *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Uma vez ao dia"
              value={form.frequencia}
              onChangeText={text => setForm({ ...form, frequencia: text })}
            />
            <Text style={styles.modalLabel}>Prescrito por</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do médico"
              value={form.prescritoPor}
              onChangeText={text => setForm({ ...form, prescritoPor: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editing ? 'Salvar' : 'Adicionar Medicamento'}
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eaeaea',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: '#222', marginBottom: 4 },
  cardLine: { color: '#222', fontSize: 14 },
  cardBold: { fontWeight: 'bold', color: '#222' },
  cardPrescrito: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  cardActions: { alignItems: 'flex-end', justifyContent: 'flex-end' },
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
    backgroundColor: 'rgba(0,0,0,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '95%',
    elevation: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  modalLabel: { fontWeight: 'bold', color: '#222', fontSize: 14, marginTop: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: 6,
    backgroundColor: '#f7f8fa',
    padding: 10,
    fontSize: 15,
    marginTop: 4,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 },
  cancelButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, backgroundColor: '#f7f8fa', marginRight: 8 },
  cancelButtonText: { color: '#222', fontWeight: 'bold', fontSize: 15 },
  saveButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, backgroundColor: '#3478f6' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
