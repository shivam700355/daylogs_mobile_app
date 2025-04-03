import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, FlatList, Modal, RefreshControl, Alert, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { addDocument, DocumentData, DocumentListResponse, getDocumentTypeList, DocumentType, getDocumentList } from '../components/Api/DocumentApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Loader from './Loader';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const Document = () => {
  // State management for document list
  const [documentList, setDocumentList] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // State management for modals
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);

  // State management for adding a document
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [documentFile, setDocumentFile] = useState<string>('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const BASE_URL = 'https://localhost:8080//employee/app-assets/documents/';

  // Fetch document list
  const fetchDocumentList = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');

      if (data && token) {
        const userId = JSON.parse(data).id;
        const response: DocumentListResponse = await getDocumentList(userId, token);
        if (response.code === 200) {
          setDocumentList(response.data || []);
        } else {
          setError(response.message);
        }
      } else {
        setError('User data or token not found.');
      }
    } catch (err) {
      setError('An error occurred while fetching the document list.');
    } finally {
      await sleep(800);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch document types
  const fetchDocumentTypes = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : null;

      if (userId && token) {
        const response = await getDocumentTypeList(userId, token);
        if (response.code === 200 && response.data) {
          setDocumentTypes(response.data);
        } else {
          Alert.alert('Error', response.message || 'Failed to fetch document types.');
        }
      } else {
        Alert.alert('Error', 'User ID or token not found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while fetching document types.');
    }
  };

  useEffect(() => {
    fetchDocumentList();
    fetchDocumentTypes();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocumentList();
  }, []);

  const handleDocumentPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].base64) {
      setDocumentFile(result.assets[0].base64);
    }
  };
  const handleSubmit = async () => {
    if (!documentNumber || !documentType || !documentFile) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : null;
      const cid = userData ? JSON.parse(userData).cid : null;

      if (userId && token) {
        const response = await addDocument({
          company_id: cid,
          user_id: userId,
          document_type: documentType,
          document_number: documentNumber,
          added_by: userId,
          document_file: documentFile,
        }, token);

        if (response.code === 200) {
          Alert.alert('Success', response.message);
          resetForm();
          setAddModalVisible(false);
          fetchDocumentList();
        } else {
          Alert.alert('Error', response.message || 'Failed to add document.');
        }
      } else {
        Alert.alert('Error', 'User ID or token not found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while submitting your document.');
    } finally {
      await sleep(800);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDocumentNumber('');
    setDocumentType('');
    setDocumentFile('');
  };
  // Format date
  const formatDate = (created_at) => {
    const dateObj = new Date(created_at);
    return dateObj.toLocaleDateString('en-GB'); // Date: 17/09/2024
  };

  // Format time
  const formatTime = (created_at) => {
    const dateObj = new Date(created_at);
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }); // Time: 12:50 PM
  };

  if (loading && !refreshing) {
    return <Loader />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
        style={styles.gradient}
      />
      <View style={styles.header}>
        <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#32333E" />
          <Text style={styles.headerText}>Document</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.displayContainer}>
        <FlatList
          data={documentList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelectedDocument(item); setModalVisible(true); }} activeOpacity={1} >
              <View style={styles.item}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: '5%' }}>
                  <Image
                    source={
                      item?.doc_file
                        ? { uri: `${BASE_URL}${item.doc_file}` }
                        : require('../assets/images/icon.png')
                    }
                    style={styles.profilePic}
                  />
                  <View>
                    <Text style={styles.title}>{item.doc_type}</Text>
                    <Text style={styles.type}>Document No.{item.doc_number}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.indexContainer}>
                    <Text style={styles.indexText}>Added On</Text>
                  </View>
                  <View style={styles.createdAtContainer}>
                    <Text style={styles.createdAtDate}><AntDesign name="calendar" size={12} color="white" /> {formatDate(item.created_at)}</Text>
                    <Text style={styles.createdAtTime}><Ionicons name="time-outline" size={12} color="white" /> {formatTime(item.created_at)}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>

      {selectedDocument && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOneBackground}>
            <View style={styles.modalOneContainer}>
              <Text style={styles.modalOneTitle}>{selectedDocument.doc_type}</Text>
              <Text style={styles.modalOneContent}>Document Number: {selectedDocument.doc_number}</Text>
              <Image
                source={
                  selectedDocument?.doc_file
                    ? { uri: `${BASE_URL}${selectedDocument.doc_file}` }
                    : require('../assets/images/icon.png')
                }
                style={styles.documentImage}
              />
              {/* ${selectedDocument.doc_file} */}
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.dismissOneButton}>
                <Text style={styles.dismissOneText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.addModalBackground}>
          <LinearGradient colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']} style={styles.gradient} />
          <TouchableOpacity style={styles.back} onPress={() => setAddModalVisible(false)}>
            <Ionicons name="chevron-back" size={24} color="#2E3735" />
          </TouchableOpacity>
          <View style={styles.addModalContainer}>
            <Text style={styles.addModalTitle}>Add Document</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={documentType}
                onValueChange={(itemValue) => setDocumentType(itemValue)}
              >
                <Picker.Item label='Select Document Type' value="" color='#222222' />
                {documentTypes.map((type) => (
                  <Picker.Item key={type.id} label={type.name} value={type.name} color='#222222' />
                ))}
              </Picker>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter Document Number"
              value={documentNumber}
              onChangeText={setDocumentNumber}
            />
            <TouchableOpacity onPress={handleDocumentPick} style={styles.input}>
              <Text>{documentFile ? 'Document Selected' : 'Upload Document'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Document;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF0F4',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 240,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '4%',
    paddingTop: hp('2%'),
    paddingBottom: '2%',
  },
  headerText: {
    fontSize: 18,
    color: '#32333E',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  displayContainer: {
    borderRadius: 20,
    marginVertical: '2%',
    paddingHorizontal: '2%',
    marginBottom:hp('6.5%'),
  },
  item: {
    backgroundColor: '#FFFFFF',
    marginVertical: '2%',
    padding: '3%',
    borderRadius: 16,
    elevation: 4,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 13,
    marginRight: '4%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  type: {
    marginTop: 8,
    fontSize: 16,
    color: '#4A5568',
  },
  description: {
    fontWeight: 'bold',
  },
  indexContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '2%',
    backgroundColor: '#76BBD033',
    borderRadius: 8,
  },
  indexText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#42435E',
  },
  createdAtContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 8,
  },
  createdAtDate: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: '#43ADCE',
    padding: '2%',
    borderRadius: 9,
    textAlign: 'center',
    marginRight: 10,
  },
  createdAtTime: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: '#42435E',
    padding: '2%',
    borderRadius: 9,
    textAlign: 'center',
  },
  modalOneBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOneContainer: {
    width: '85%',
    backgroundColor: '#FAFAFA',
    borderRadius: 15,
    paddingTop: '5%',
  },
  modalOneTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginVertical: '3%',
    marginHorizontal: '5%',
  },
  modalOneContent: {
    fontSize: 16,
    color: '#22222299',
    marginHorizontal: '5%',
    marginVertical: '3%',
    lineHeight: 24,
    textAlign: 'justify',
  },
  dismissOneButton: {
    borderRadius: 10,
    backgroundColor: '#43ADCE33',
    width: '100%',
    paddingVertical: '3%'
  },
  dismissOneText: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 29,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  documentImage: {
    width: '100%',
    height: 500,
    resizeMode: 'contain',
    marginBottom: '4%',
  },
  addButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#32333E',
    borderRadius: 30,
    elevation: 10,
    right: 30,
    bottom: 30,
  },
  addModalBackground: {
    flex: 1,
    backgroundColor: '#EBF0F4',
  },
  back: {
    paddingHorizontal: '2%',
    paddingVertical: '4%'
  },
  addModalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignSelf: 'center',
  },
  addModalTitle: {
    fontSize: 24,
    color: '#222222',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  input: {
    fontSize: 16,
    color: '#222222',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: '4%',
    paddingVertical: '3%',
    marginVertical: '5%',
  },
  submitButton: {
    backgroundColor: '#43ADCE',
    padding: 15,
    borderRadius: 100,
    alignItems: 'center',
    marginVertical: '10%',
  },
  submitButtonText: {
    color: '#FEFEFE',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
