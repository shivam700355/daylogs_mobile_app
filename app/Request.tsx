import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, FlatList, Image, Modal, RefreshControl, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { getRequestList, RequestData, RequestResponse, addRequest, RequestType, RequestTypeResponse, getRequestTypeList } from '../components/Api/RequestListApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Loader from './Loader';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const Request = () => {
    const [requestList, setRequestList] = useState<RequestData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
    const [requestTitle, setRequestTitle] = useState<string>('');
    const [requestDesc, setRequestDesc] = useState<string>('');
    const [requestType, setRequestType] = useState<string>('');
    const [requestDate, setRequestDate] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showSearchBar, setShowSearchBar] = useState<boolean>(false);

    const fetchRequestList = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');

            if (data && token) {
                const userId = JSON.parse(data).id;
                const response: RequestResponse = await getRequestList(userId, token);
                if (response.code === 200) {
                    setRequestList(response.data || []);
                } else {
                    setError(response.message);
                }
            } else {
                setError('User data or token not found.');
            }
        } catch (err) {
            setError('An error occurred while fetching the request list.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    const fetchRequestTypes = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userData = await AsyncStorage.getItem('userData');
            const userId = userData ? JSON.parse(userData).id : null;

            if (userId && token) {
                const response: RequestTypeResponse = await getRequestTypeList(userId, token);
                if (response.code === 200 && response.data) {
                    setRequestTypes(response.data);
                } else {
                    Alert.alert('Error', response.message || 'Failed to fetch request types.');
                }
            } else {
                Alert.alert('Error', 'User ID or token not found.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong while fetching request types.');
        }
    };

    useEffect(() => {
        fetchRequestList();
        fetchRequestTypes();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRequestList();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit', weekday: 'long' };
        return date.toLocaleDateString('en-GB', options);
    };

    const formatCreatedAt = (dateString: string) => {
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-GB');
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        return { formattedDate, formattedTime };
    };

    const openModal = (request: RequestData) => {
        setSelectedRequest(request);
        setModalVisible(true);
    };
    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setRequestDate(selectedDate);
        }
    };

    const handleSubmit = async () => {
        if (!requestTitle || !requestDesc || !requestType || !requestDate) {
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
                const response = await addRequest({
                    company_id: cid,
                    user_id: userId,
                    request_date: requestDate.toISOString().split('T')[0],
                    request_type: requestType,
                    request_title: requestTitle,
                    request_desc: requestDesc,
                }, token);

                if (response.code === 200) {
                    Alert.alert('Success', response.message);
                    resetForm();
                    setAddModalVisible(false);
                    fetchRequestList();
                } else {
                    Alert.alert('Error', response.message || 'Failed to add request.');
                }
            } else {
                Alert.alert('Error', 'User ID or token not found.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong while submitting your request.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setRequestTitle('');
        setRequestDesc('');
        setRequestType('');
        setRequestDate(undefined);
    };
    const handleSearchPress = () => {
        setShowSearchBar(!showSearchBar);
    };

    const filteredRequests = requestList.filter(request =>
        request.r_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.r_desc.toLowerCase().includes(searchQuery.toLowerCase())||
        request.r_action.toLowerCase().includes(searchQuery.toLowerCase())||
        request.r_date.toLowerCase().includes(searchQuery.toLowerCase())||
        request.r_type.toLowerCase().includes(searchQuery.toLowerCase())||
        request.status.toString().includes(searchQuery.toLowerCase())
    );

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
                    <Text style={styles.headerText}>Requests</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.searchIconContainer} onPress={handleSearchPress}>
                    <Image source={require('../assets/images/search-normal.png')} style={styles.searchImage} />
                </TouchableOpacity>
            </View>

            {showSearchBar && (
                <View style={styles.searchContainer}>
                    <Image source={require('../assets/images/search.png')} style={styles.searchImage} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            )}

            <View style={styles.displayContainer}>
                <FlatList
                    data={filteredRequests}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => {
                        const { formattedDate, formattedTime } = formatCreatedAt(item.created_at);

                        return (
                            <TouchableOpacity onPress={() => openModal(item)} activeOpacity={1} >
                                <View style={styles.item}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={styles.date}>{formatDate(item.r_date)}</Text>
                                        <Text
                                            style={[
                                                styles.action,
                                                {
                                                    color: item.r_action === 'Pending'
                                                        ? '#D9534F'
                                                        : item.r_action === 'Rejected'
                                                            ? '#D9534F' // Red color for Rejected status
                                                            : '#5CB85C' // Green color for other statuses (e.g., Approved)
                                                }
                                            ]}
                                        >
                                            <FontAwesome
                                                name={item.r_action === 'Pending'
                                                    ? 'clock-o'
                                                    : item.r_action === 'Rejected'
                                                        ? 'times' // Cross icon for Rejected status
                                                        : 'check' // Check icon for other statuses (e.g., Approved)
                                                }
                                                size={12}
                                                color={item.r_action === 'Pending'
                                                    ? '#D9534F'
                                                    : item.r_action === 'Rejected'
                                                        ? '#D9534F' // Red color for Rejected icon
                                                        : '#5CB85C' // Green color for other statuses (e.g., Approved)
                                                }
                                            />
                                            {` ${item.r_action}`}
                                        </Text>
                                    </View>
                                    <Text style={styles.type}>{item.r_type}</Text>
                                    <Text style={styles.description}>{item.r_title}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <View style={styles.indexContainer}>
                                            <Text style={styles.indexText}>Requested At</Text>
                                        </View>
                                        <View style={styles.createdAtContainer}>
                                            <Text style={styles.createdAtDate}><AntDesign name="calendar" size={12} color="white" /> {formattedDate}</Text>
                                            <Text style={styles.createdAtTime}><Ionicons name="time-outline" size={12} color="white" /> {formattedTime}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            </View>

            {selectedRequest && (
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOneBackground}>
                        <View style={styles.modalOneContainer}>
                            <View>
                                <Text style={styles.modalOneTitle}>{selectedRequest.r_type}</Text>
                            </View>
                            <Text style={styles.modalOneContent}>{selectedRequest.r_desc}</Text>
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
                    <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#2E3735" />
                    </TouchableOpacity>
                    <View style={styles.addModalContainer}>
                        <Text style={styles.addModalTitle}>Add Request</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={requestType}
                                onValueChange={(itemValue) => setRequestType(itemValue)}
                            >
                                <Picker.Item label='Request Type' value="" color='#222222' />
                                {requestTypes.map((type) => (
                                    <Picker.Item key={type.id} label={type.type} value={type.type} color='#222222' />
                                ))}
                            </Picker>
                        </View>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateContainer}>
                            <Text style={styles.dateInput}>
                                {requestDate ? requestDate.toLocaleDateString('en-GB') : 'Request Date'}
                            </Text>
                            <View style={{ position: 'absolute', right: 10, top: 9 }} >
                                <AntDesign name="calendar" size={24} color="#2E3735" />
                            </View>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={requestDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                        )}
                        <TextInput
                            style={styles.input}
                            placeholder="Request Title"
                            value={requestTitle}
                            onChangeText={setRequestTitle}
                        />
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Request Description"
                            value={requestDesc}
                            onChangeText={setRequestDesc}
                            multiline
                            numberOfLines={8}
                        />
                        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                            <Text style={styles.submitButtonText}>Submit Request</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal >

            <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
        </View >
    );
};

export default Request;

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
        paddingTop: hp('3%'),
        paddingBottom: '2%',
    },
    headerText: {
        fontSize: 18,
        color: '#32333E',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    searchImage: {
        width: 20,
        height: 20,
        margin: 10,
    },
    searchIconContainer: {
        height: 40,
        width: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF33',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        margin: 10,
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        color: '#9DA1A5',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 50,
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
        marginBottom: 90,
    },
    item: {
        backgroundColor: '#FFFFFF',
        marginVertical: '2%',
        padding: '3%',
        borderRadius: 16,
        elevation: 4,
    },
    date: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#32333E',
    },
    action: {
        fontWeight: 'bold',
        fontSize: 12,
        marginRight: '2%',
    },
    description: {
        marginTop: 8,
        fontSize: 12,
        color: '#A0AEC0',
    },
    type: {
        marginTop: 4,
        fontSize: 12,
        color: '#43ADCE',
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
        width: '75%',
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
    fab: {
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
    dateInput: {
        fontSize: 16,
        color: '#222222',
    },
    dateContainer: {
        fontSize: 16,
        color: '#222222',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: '6%',
        paddingVertical: '3%',
        marginVertical: '5%',
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
    multilineInput: {
        textAlignVertical: 'top',
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
