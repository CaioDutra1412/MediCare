import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from '../services/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

function formatarDataISOparaBR(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('T')[0].split('-');
  return `${dia.padStart(2, '0')}-${mes.padStart(2, '0')}-${ano}`;
}

const STATUS_COLORS = {
  confirmada: '#d1fae5',
  pendente: '#fef9c3',
  realizada: '#e5e7eb',
};
const STATUS_TEXT_COLORS = {
  confirmada: '#059669',
  pendente: '#b45309',
  realizada: '#374151',
};

const STATUS_OPTIONS = [
  { label: 'Confirmada', value: 'confirmada' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Realizada', value: 'realizada' },
];

export default function AppointmentsScreen({ navigation }) {
  const [tab, setTab] = useState('proximas');
  const [consultas, setConsultas] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    medicoNome: '',
    especialidade: '',
    data: '',
    hora: '',
    local: '',
    status: 'confirmada',
    notas: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid),
      orderBy('data', 'asc')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConsultas(list);
    });
    return unsubscribe;
  }, []);

  // Filtra por aba e busca
  const now = new Date();
  const filtered = consultas.filter(c => {
    const consultaDate = new Date(`${c.data}T${c.hora}`);
    if (tab === 'proximas') {
      if (consultaDate < now) return false;
    } else {
      if (consultaDate >= now) return false;
    }
    const s = search.toLowerCase();
    return (
      c.medicoNome.toLowerCase().includes(s) ||
      c.especialidade.toLowerCase().includes(s) ||
      c.local.toLowerCase().includes(s)
    );
  });

  // Abre modal para adicionar ou editar
  const openModal = (consulta = null) => {
    setEditing(consulta);
    setForm(
      consulta
        ? {
            medicoNome: consulta.medicoNome,
            especialidade: consulta.especialidade,
            data: consulta.data,
            hora: consulta.hora,
            local: consulta.local,
            status: consulta.status,
            notas: consulta.notas || '',
          }
        : {
            medicoNome: '',
            especialidade: '',
            data: '',
            hora: '',
            local: '',
            status: 'confirmada',
            notas: '',
          }
    );
    setModalVisible(true);
  };

  // Salva nova consulta ou edição
  const handleSave = async () => {
    if (!form.medicoNome || !form.especialidade || !form.data || !form.hora || !form.local) {
      Alert.alert('Preencha todos os campos obrigatórios.');
      return;
    }
    try {
      const user = auth.currentUser;
      if (editing) {
        await updateDoc(doc(db, 'appointments', editing.id), {
          medicoNome: form.medicoNome,
          especialidade: form.especialidade,
          data: form.data,
          hora: form.hora,
          local: form.local,
          status: form.status,
          notas: form.notas,
        });
      } else {
        await addDoc(collection(db, 'appointments'), {
          userId: user.uid,
          medicoNome: form.medicoNome,
          especialidade: form.especialidade,
          data: form.data,
          hora: form.hora,
          local: form.local,
          status: form.status,
          notas: form.notas,
        });
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Erro ao salvar consulta.');
    }
  };

  // Excluir consulta
  const handleDelete = async id => {
    Alert.alert('Excluir consulta?', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'appointments', id));
          } catch (e) {
            Alert.alert('Erro ao excluir consulta.');
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
        <Text style={styles.headerTitle}>Consultas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Adicionar</Text>
                </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'proximas' && styles.tabActive]}
          onPress={() => setTab('proximas')}
        >
          <Text style={[styles.tabText, tab === 'proximas' && styles.tabTextActive]}>Próximas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'passadas' && styles.tabActive]}
          onPress={() => setTab('passadas')}
        >
          <Text style={[styles.tabText, tab === 'passadas' && styles.tabTextActive]}>Passadas</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar consulta..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Lista de consultas */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>
            Nenhuma consulta encontrada.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.medicoNome}>{item.medicoNome}</Text>
              <Text style={styles.especialidade}>{item.especialidade}</Text>
              <View style={styles.row}>
                <MaterialIcons name="event" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.info}>{formatarDataISOparaBR(item.data)}</Text>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="access-time" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.info}>{item.hora}</Text>
              </View>
              <View style={styles.row}>
                <Ionicons name="location-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.info}>{item.local}</Text>
              </View>
            </View>
            <View style={styles.actionsColumn}>
              <Text
                style={{
                  backgroundColor: STATUS_COLORS[item.status] || '#e5e7eb',
                  color: STATUS_TEXT_COLORS[item.status] || '#374151',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  fontSize: 13,
                  fontWeight: 'bold',
                  alignSelf: 'flex-start',
                  marginBottom: 8,
                }}
              >
                {item.status}
              </Text>
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

      {/* Modal de adicionar/editar consulta */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editing ? 'Editar Consulta' : 'Nova Consulta'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do médico"
              value={form.medicoNome}
              onChangeText={text => setForm({ ...form, medicoNome: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Especialidade"
              value={form.especialidade}
              onChangeText={text => setForm({ ...form, especialidade: text })}
            />

            {/* Campo de Data com DatePicker */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: form.data ? '#222' : '#aaa', fontSize: 15 }}>
                {form.data ? formatarDataISOparaBR(form.data) : 'Selecione a data'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.data ? new Date(form.data) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const yyyy = selectedDate.getFullYear();
                    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(selectedDate.getDate()).padStart(2, '0');
                    setForm({ ...form, data: `${yyyy}-${mm}-${dd}` });
                  }
                }}
              />
            )}

            {/* Campo de Hora com TimePicker */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ color: form.hora ? '#222' : '#aaa', fontSize: 15 }}>
                {form.hora ? form.hora : 'Selecione a hora'}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={
                  form.hora
                    ? new Date(`1970-01-01T${form.hora}`)
                    : new Date()
                }
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    const hh = String(selectedTime.getHours()).padStart(2, '0');
                    const mm = String(selectedTime.getMinutes()).padStart(2, '0');
                    setForm({ ...form, hora: `${hh}:${mm}` });
                  }
                }}
              />
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="Local"
              value={form.local}
              onChangeText={text => setForm({ ...form, local: text })}
            />
            <View style={{ marginVertical: 8 }}>
              <Text style={{ fontWeight: 'bold', color: '#222', marginBottom: 2 }}>Status</Text>
              <View style={{ flexDirection: 'row' }}>
                {STATUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={{
                      backgroundColor: form.status === opt.value ? '#3478f6' : '#f7f8fa',
                      borderRadius: 6,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      marginRight: 8,
                    }}
                    onPress={() => setForm({ ...form, status: opt.value })}
                  >
                    <Text style={{
                      color: form.status === opt.value ? '#fff' : '#222',
                      fontWeight: 'bold',
                    }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Notas (opcional)"
              value={form.notas}
              onChangeText={text => setForm({ ...form, notas: text })}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editing ? 'Salvar' : 'Adicionar'}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f6fb',
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    height: 38,
    alignItems: 'center',
    padding: 2,
  },
  tab: {
    flex: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 34,
  },
  tabActive: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabText: { color: '#7b8ca7', fontWeight: 'bold', fontSize: 15 },
  tabTextActive: { color: '#3478f6' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eaeaea',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  medicoNome: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  especialidade: { color: '#3478f6', fontSize: 13, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  info: { color: '#222', fontSize: 14 },
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
  editBtnText: { color: '#222', fontWeight: 'bold', fontSize: 14 },
  // Modal styles
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
    width: '92%',
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
