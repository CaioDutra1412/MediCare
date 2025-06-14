import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export default function HomeScreen() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [proximasConsultas, setProximasConsultas] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const fetchNome = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setNomeUsuario(userDoc.data().nome);
          } else {
            setNomeUsuario(user.email);
          }
        } catch (e) {
          setNomeUsuario(user.email);
        }
      };
      fetchNome();
    }
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    const dataHoje = `${yyyy}-${mm}-${dd}`;

    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid),
      where('data', '>=', dataHoje),
      where('status', '==', 'confirmada'),
      orderBy('data', 'asc'),
      orderBy('hora', 'asc')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProximasConsultas(list.slice(0, 4));
    });
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerHello}>Olá, {nomeUsuario}!</Text>
          <Text style={styles.headerSubtitle}>Como está sua saúde hoje?</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('Doctors')}>
            <FontAwesome5 name="user-md" size={20} color="#3478f6" />
            <Text style={styles.quickAccessText}>Médicos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('Appointments')}>
            <MaterialIcons name="event-available" size={20} color="#2ecc71" />
            <Text style={styles.quickAccessText}>Consultas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('Documents')}>
            <Ionicons name="document-text-outline" size={20} color="#a259d9" />
            <Text style={styles.quickAccessText}>Documentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('Medications')}>
            <MaterialIcons name="medication" size={20} color="#e67e22" />
            <Text style={styles.quickAccessText}>Medicamentos</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Próximas Consultas</Text>
        {proximasConsultas.length === 0 && (
          <Text style={{ color: '#888', marginBottom: 10 }}>Nenhuma consulta confirmada.</Text>
        )}
        {proximasConsultas.map(item => (
          <View key={item.id} style={styles.appointmentCard}>
            <View>
              <Text style={styles.appointmentDoctor}>{item.medicoNome}</Text>
              <Text style={styles.appointmentSpecialty}>{item.especialidade}</Text>
            </View>
            <View style={styles.appointmentDate}>
              <Text style={styles.appointmentDateText}>{item.data}</Text>
              <Text style={styles.appointmentTime}>{item.hora}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.tabItemActive} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#3478f6" />
          <Text style={styles.tabLabelActive}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Appointments')}>
          <MaterialIcons name="event-available" size={22} color="#7b8ca7" />
          <Text style={styles.tabLabel}>Consultas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Documents')}>
          <Ionicons name="document-text-outline" size={22} color="#7b8ca7" />
          <Text style={styles.tabLabel}>Documentos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Doctors')}>
          <FontAwesome5 name="user-md" size={22} color="#7b8ca7" />
          <Text style={styles.tabLabel}>Médicos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  header: { backgroundColor: '#3478f6', paddingTop: 48, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  headerHello: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#eaf1ff', fontSize: 14, marginTop: 4 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  quickAccessContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  quickAccessButton: { width: '48%', backgroundColor: '#f0f6ff', borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  quickAccessText: { marginLeft: 10, color: '#222', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 8, marginTop: 8 },
  appointmentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2 },
  appointmentDoctor: { fontWeight: 'bold', color: '#222', fontSize: 15 },
  appointmentSpecialty: { color: '#7b8ca7', fontSize: 13, marginTop: 2 },
  appointmentDate: { alignItems: 'flex-end' },
  appointmentDateText: { color: '#7b8ca7', fontSize: 13 },
  appointmentTime: { color: '#222', fontWeight: 'bold', fontSize: 14 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 56,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabLabel: { fontSize: 11, color: '#7b8ca7', marginTop: 2 },
  tabItemActive: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabLabelActive: { fontSize: 11, color: '#3478f6', marginTop: 2, fontWeight: 'bold' },
});
