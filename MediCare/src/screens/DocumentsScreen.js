import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { auth, db } from '../services/firebaseConfig';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const TABS = ['Exames', 'Receitas', 'Atestados'];

export default function DocumentsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('Exames');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carrega documentos do usuário logado
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', user.uid),
      orderBy('nome')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocs(list);
    });
    return unsubscribe;
  }, []);

  // Filtro por aba e busca
  const filteredDocs = docs.filter(
    doc =>
      doc.categoria === tab &&
      (doc.nome.toLowerCase().includes(search.toLowerCase()) ||
        (doc.medico || '').toLowerCase().includes(search.toLowerCase()))
  );

  // Upload de documento com logs detalhados
  const handleUpload = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('Usuário não autenticado');
        return;
      }
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      if (res.type === 'cancel') {
        console.log('Seleção de documento cancelada');
        return;
      }

      setLoading(true);

      // Pega informações do arquivo
      const fileUri = res.assets[0].uri;
      const fileName = res.assets[0].name;
      const fileType = res.assets[0].mimeType || 'application/octet-stream';
      const fileSize = res.assets[0].size;

      console.log('Arquivo selecionado:', { fileUri, fileName, fileType, fileSize });

      // Metadados básicos
      let categoria = tab;
      let nome = fileName.replace(/\.[^/.]+$/, '');
      let medico = '';
      let data = new Date().toISOString().slice(0, 10);

      // Upload para o Storage usando blob
      const storage = getStorage();
      const storageRef = ref(storage, `documents/${user.uid}/${Date.now()}_${fileName}`);
      let response, blob;
      try {
        response = await fetch(fileUri);
        blob = await response.blob();
        console.log('Blob criado com sucesso');
      } catch (e) {
        console.log('Erro ao criar blob:', e);
        throw e;
      }
      try {
        await uploadBytes(storageRef, blob, { contentType: fileType });
        console.log('Upload para Storage realizado');
      } catch (e) {
        console.log('Erro no upload para Storage:', e);
        throw e;
      }

      // Pega URL de download
      let url;
      try {
        url = await getDownloadURL(storageRef);
        console.log('URL de download obtida:', url);
      } catch (e) {
        console.log('Erro ao obter URL de download:', e);
        throw e;
      }

      // Salva metadados no Firestore
      try {
        await addDoc(collection(db, 'documents'), {
          userId: user.uid,
          nome,
          categoria,
          medico,
          data,
          tipo: fileType.toUpperCase().split('/').pop(),
          tamanho: fileSize ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '',
          url,
          storagePath: storageRef.fullPath,
        });
        console.log('Documento salvo no Firestore');
      } catch (e) {
        console.log('Erro ao salvar no Firestore:', e);
        throw e;
      }

      setLoading(false);
      Alert.alert('Sucesso', 'Documento enviado!');
    } catch (e) {
      setLoading(false);
      console.log('ERRO FINAL:', e);
      Alert.alert('Erro', 'Não foi possível enviar o documento.\n' + (e && e.message ? e.message : ''));
    }
  };

  // Excluir documento (Firestore + Storage)
  const handleDelete = async docItem => {
    try {
      setLoading(true);
      const storage = getStorage();
      await deleteObject(ref(storage, docItem.storagePath));
      await deleteDoc(doc(db, 'documents', docItem.id));
      setLoading(false);
    } catch (e) {
      setLoading(false);
      Alert.alert('Erro ao excluir documento.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documentos</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Campo de busca */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar documentos..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de documentos */}
      {loading && (
        <ActivityIndicator size="large" color="#3478f6" style={{ marginTop: 20 }} />
      )}
      <FlatList
        data={filteredDocs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>
            Nenhum documento encontrado.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Feather name="file-text" size={28} color="#3478f6" />
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.docTitle}>{item.nome}</Text>
              <Text style={styles.docSubtitle}>{item.medico}</Text>
              <View style={styles.docMetaRow}>
                <Text style={styles.docMeta}>{item.data}</Text>
                <Text style={styles.docMeta}>• {item.tipo}</Text>
                <Text style={styles.docMeta}>• {item.tamanho}</Text>
              </View>
            </View>
            <View style={styles.actionsBox}>
              <TouchableOpacity onPress={() => item.url && Alert.alert('Download', 'URL copiada para área de transferência!')}>
                <Ionicons name="download-outline" size={22} color="#3478f6" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 10 }} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
  uploadButton: {
    backgroundColor: '#3478f6',
    borderRadius: 8,
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f6fb',
    borderRadius: 8,
    marginHorizontal: 12,
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f3f6fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoBox: { flex: 1 },
  docTitle: { fontWeight: 'bold', fontSize: 15, color: '#222' },
  docSubtitle: { color: '#3478f6', fontSize: 13, marginTop: 2 },
  docMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  docMeta: { color: '#6b7280', fontSize: 12, marginRight: 8 },
  actionsBox: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
