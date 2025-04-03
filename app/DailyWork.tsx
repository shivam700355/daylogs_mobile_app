import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { getWorkReportList, WorkReportData, WorkReportResponse, addWorkReport } from '../components/Api/DailyWorkApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Loader from './Loader';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const DailyWork = () => {
    const [workReports, setWorkReports] = useState<WorkReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [workDesc, setWorkDesc] = useState('');
    const [workDate, setWorkDate] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedReport, setSelectedReport] = useState<WorkReportData | null>(null);
    const [userName, setUserName] = useState('');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 4);

    const fetchWorkReports = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');

            if (data && token) {
                const parsedData = JSON.parse(data);
                const userId = parsedData.id;
                setUserName(parsedData.name);

                const response: WorkReportResponse = await getWorkReportList(userId, token);
                if (response.code === 200) {
                    setWorkReports(response.data || []);
                } else {
                    setError(response.message);
                }
            } else {
                setError('User data or token not found.');
            }
        } catch (err) {
            setError('An error occurred while fetching the work report list.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWorkReports();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', weekday: 'long' });
    };

    const formatCreatedAt = (dateString: string) => {
        const date = new Date(dateString);
        return {
            formattedDate: date.toLocaleDateString('en-GB'),
            formattedTime: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
    };

    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        setShowDatePicker(false);
        if (selectedDate) setWorkDate(selectedDate);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchWorkReports();
    }, []);

    const handleCardPress = (report: WorkReportData) => {
        setSelectedReport(report);
        setDetailModalVisible(true); // Open detail modal
    };

    const openModal = () => setModalVisible(true);

    const handleSubmit = async () => {
        if (!workDesc || !workDate) {
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
                const response = await addWorkReport({
                    action: "addWork",
                    company_id: cid,
                    user_id: userId,
                    work_date: workDate.toISOString().split('T')[0],
                    work_desc: workDesc,
                }, token);

                if (response.code === 200) {
                    Alert.alert('Success', response.message);
                    resetForm();
                    setModalVisible(false);
                    fetchWorkReports();
                } else {
                    Alert.alert('Error', response.message || 'Failed to add work report.');
                }
            } else {
                Alert.alert('Error', 'User ID or token not found.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong while submitting your work report.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setWorkDesc('');
        setWorkDate(undefined);
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
                    <Text style={styles.headerText}>Work Report</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.displayContainer}>
                <FlatList
                    data={workReports}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => {
                        const { formattedDate, formattedTime } = formatCreatedAt(item.created_at);

                        return (
                            <TouchableOpacity onPress={() => handleCardPress(item)} activeOpacity={1}>
                                <View style={styles.item}>
                                    <Text style={styles.date}>{formatDate(item.w_date)}</Text>
                                    <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">{item.w_desc}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <View style={styles.indexContainer}>
                                            <Image source={require('../assets/images/note.png')} />
                                            <Text style={styles.indexText}>{index + 1}</Text>
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
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            </View>
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.addModalBackground}>
                    <LinearGradient colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']} style={styles.gradient} />
                    <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#2E3735" />
                    </TouchableOpacity>
                    <View style={styles.addModalContainer}>
                        <Text style={styles.addModalTitle}>Add Work Report</Text>
                        <View style={styles.dateContainer}>
                            <Text style={styles.dateInput}>{userName}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateContainer}>
                            <Text style={styles.dateInput}>
                                {workDate ? workDate.toLocaleDateString('en-GB') : 'Work Date'}
                            </Text>
                            <AntDesign name="calendar" size={24} color="#2E3735" style={styles.calendarIcon} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={workDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                minimumDate={oneWeekAgo}
                                maximumDate={new Date()}
                            />
                        )}
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Work Description"
                            value={workDesc}
                            onChangeText={setWorkDesc}
                            multiline
                            numberOfLines={4}
                        />
                        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={detailModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.detailModalBackground}>
                    <LinearGradient colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']} style={styles.gradient} />
                    {selectedReport && (
                        <View style={styles.detailModalContainer}>
                            <Text style={styles.detailModalTitle}>Report Details</Text>
                            <Text style={styles.detailModalDate}>{formatDate(selectedReport.w_date)}</Text>
                            <View style={styles.modalScrollContainer}>
                                <ScrollView>
                                    <Text style={styles.detailModalDescription}>{selectedReport.w_desc}</Text>
                                </ScrollView>
                            </View>
                            <Text ></Text>
                            <TouchableOpacity style={styles.dismissButton} onPress={() => setDetailModalVisible(false)}>
                                <Text style={styles.dismissText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
            <TouchableOpacity style={styles.fab} onPress={openModal}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default DailyWork;

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
        paddingBottom:hp('1.8%'),
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
    description: {
        marginTop: 8,
        fontSize: 12,
        color: '#A0AEC0',
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
    dateInput: {
        fontSize: 16,
        color: '#222222',
        flex: 1,
    },
    calendarIcon: {
        marginLeft: 8,
    },
    input: {
        fontSize: 16,
        color: '#222222',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: '6%',
        paddingVertical: '3%',
        marginVertical: '8%',
    },
    multilineInput: {
        height: 100,
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
    detailModalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    detailModalContainer: {
        width: '75%',
        backgroundColor: '#FAFAFA',
        borderRadius: 15,
        paddingTop: '5%',
    },
    detailModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222222',
        marginVertical: '3%',
        marginHorizontal: '5%',
    },
    detailModalDate: {
        fontSize: 16,
        color: '#222222',
        marginHorizontal: '5%',
        marginVertical: '3%',
        lineHeight: 24,
    },
    modalScrollContainer: {
        maxHeight: 500,
    },
    detailModalDescription: {
        fontSize: 16,
        color: '#22222299',
        marginHorizontal: '5%',
        marginVertical: '3%',
        lineHeight: 20,
        textAlign: 'justify',
    },
    dismissButton: {
        borderRadius: 10,
        backgroundColor: '#43ADCE33',
        width: '100%',
        paddingVertical: '3%'
    },
    dismissText: {
        textAlign: 'center',
        fontSize: 18,
        lineHeight: 29,
        fontWeight: 'bold',
        color: '#2D3748',
    },

});
