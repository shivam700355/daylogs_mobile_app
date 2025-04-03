import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Alert, FlatList, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentMonthAttendance, getAttendanceReport, AttendanceData, AttendanceLog, getAttendanceLog } from '../components/Api/AttendanceApi';
import Loader from './Loader';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [reportData, setReportData] = useState<AttendanceData[]>([]);
  const [showDatePickers, setShowDatePickers] = useState<boolean>(false);
  const [dateTimeout, setDateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logData, setLogData] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : null;

      if (userId && token) {
        const response = await getCurrentMonthAttendance(userId, token);
        if (response.code === 200 && response.data) {
          setAttendanceData(response.data);
        } else {
          Alert.alert('Error', response.message || 'Failed to fetch attendance data');
        }
      } else {
        Alert.alert('Error', 'User ID or token not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      await sleep(800);  // Ensure loader shows for at least 2 seconds
      setLoading(false);
      setRefreshing(false);
    }
  };


  const fetchReport = async (start: Date, end: Date) => {
    if (!start || !end) {
      Alert.alert('Please select both start and end dates');
      return;
    }

    if (end < start) {
      Alert.alert('End date cannot be before start date');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : null;
      const formattedStartDate = start.toISOString().split('T')[0];
      const formattedEndDate = end.toISOString().split('T')[0];
      const reportResponse = await getAttendanceReport(userId, formattedStartDate, formattedEndDate, token);
      if (reportResponse.code === 200) {
        setReportData(reportResponse.data || []);
      } else {
        Alert.alert('Failed to fetch report', reportResponse.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while fetching the report');
    } finally {
      await sleep(800);  // Ensure loader shows for at least 2 seconds
      setLoading(false);
      setRefreshing(false);
    }
  };
  const handleCalendarButtonPress = () => {
    setShowDatePickers(prev => !prev);
  };

  const handleStartDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (dateTimeout) {
        clearTimeout(dateTimeout);
      }
      const timeout = setTimeout(() => {
        if (!endDate) {
          Alert.alert('Please select both start and end dates');
        }
      }, 10000);
      setDateTimeout(timeout);
    }
  };

  const fetchAttendanceLog = async (attendanceId: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : null;

      if (userId && token) {
        const response = await getAttendanceLog(userId, attendanceId, token);
        if (response.code === 200 && response.data) {
          setLogData(response.data);
        } else {
          Alert.alert('Error', response.message || 'Failed to fetch attendance logs');
        }
      } else {
        Alert.alert('Error', 'User ID or token not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleEndDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      if (dateTimeout) {
        clearTimeout(dateTimeout);
      }
      fetchReport(startDate!, selectedDate);
    }
  };

  const formatSN = (index: number) => (index + 1).toString().padStart(2, '0');

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '00:00:00') return '- - - - - - -';

    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));

    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };

    return date.toLocaleTimeString('en-US', options);
  };

  const handleDatePress = async (date: string) => {
    const attendanceItem = attendanceData.find(item => item.checkin_date === date)
      || reportData.find(item => item.checkin_date === date);

    if (attendanceItem) {
      setSelectedDate(date);
      await fetchAttendanceLog(attendanceItem.id);
      setModalVisible(true);
    } else {
      Alert.alert('No logs available for this date');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttendanceData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']} style={styles.gradient} />
      <View style={styles.header}>
        <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2E3735" />
          <Text style={styles.headerText}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterContainer} onPress={handleCalendarButtonPress}>
          <MaterialCommunityIcons name="filter" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View>
        {showDatePickers && (
          <View style={styles.datePickerContainer}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
              <Ionicons name="calendar" size={20} color="#333" />
              <Text style={styles.dateText}>{startDate?.toDateString() || 'Start Date'}</Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
                maximumDate={new Date()}
              />
            )}

            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
              <Ionicons name="calendar" size={20} color="#333" />
              <Text style={styles.dateText}>{endDate?.toDateString() || 'End Date'}</Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        )}
        <View style={[styles.attendanceContainer, { paddingBottom: showDatePickers ? 380 : 220 }]}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportText}>SN</Text>
            <Text style={[styles.reportText, { width: '22%' }]}>Date</Text>
            <Text style={styles.reportText}>Check-In</Text>
            <Text style={styles.reportText}>Check-Out</Text>
            <Text style={styles.reportText}>HI</Text>
          </View>
          <FlatList
            data={startDate ? reportData : attendanceData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={[
                styles.reportItem,
                { backgroundColor: index % 2 === 0 ? '#fff' : '#e6faff' }
              ]}
                onPress={() => handleDatePress(item.checkin_date)}
              >
                <Text style={styles.sn}>{formatSN(index)}.</Text>
                <View>
                  <Text style={styles.date}>{item.checkin_date}</Text>
                  <Text style={styles.day}>{new Date(item.checkin_date).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                </View>
                <Text style={styles.checkin}>{formatTime(item.checkin_time)}</Text>
                <Text style={styles.checkout}>{formatTime(item.checkout_time)}</Text>
                <Text style={styles.status}>
                  {(() => {
                    switch (item.h_index) {
                      case 5: return '🥳';
                      case 4: return '😃';
                      case 3: return '🙂';
                      case 2: return '🙁';
                      case 1: return '😣';
                      default: return '-----';
                    }
                  })()}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={startDate && endDate && reportData.length === 0 ? (
              <Text style={styles.emptyMessage}>No attendance data available.</Text>
            ) : null}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>
      </View>
      {/* Modal for Attendance Logs */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']} style={styles.gradient} />
          <TouchableOpacity style={styles.back} onPress={() => setModalVisible(false)}>
            <Ionicons name="chevron-back" size={24} color="#2E3735" />
          </TouchableOpacity>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#42435E', '#43ADCE']}
              style={styles.gradientOne}
            >
              <View style={styles.innerModalContainer}>
                <Text style={styles.modalTitle}>{new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
                <FlatList
                  data={logData}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.modalItem}>
                      <Image
                        source={item.log_type === 'Check in'
                          ? require('../assets/images/check-in.png')
                          : require('../assets/images/check-out.png')
                        }
                        style={styles.checkImage}
                      />
                      <View>
                        <Text style={styles.modalDescription}>{item.log_type}</Text>
                        <Text style={styles.modalDescriptionTime}>
                          {new Date(item.log_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Text>
                        <Text style={styles.modalDescriptionText}>{item.log_location}</Text>
                        <Text style={styles.modalDescriptionLocation}>{item.log_lat_long}</Text>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={<Text>No logs available for this date.</Text>}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Attendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '40%',
  },
  filterContainer: {
    height: 35,
    width: 35,
    borderRadius: 10,
    backgroundColor: '#FFFFFF33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    margin: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#2D3748',
  },
  reportItem: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  sn: {
    textAlign: 'center',
  },
  date: {
    textAlign: 'left',
    width: '100%',
  },
  day: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  checkin: {
    textAlign: 'center',
    color: '#216D0D',
    fontSize: 12,
    fontWeight: 'bold',
    width: '16%',
  },
  checkout: {
    textAlign: 'center',
    color: '#D72810',
    fontSize: 12,
    fontWeight: 'bold',
    width: '16%',
  },
  status: {
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    marginVertical: 20,
  },
  attendanceContainer: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderColor: '#E2E8F0',
    borderBottomWidth: 1,
    marginVertical: '2%',
  },
  reportText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#EBF0F4',
  },
  back: {
    paddingHorizontal: '2%',
    paddingVertical: '4%'
  },
  modalContent: {
    width: '95%',
    alignSelf: 'center',
    borderRadius: 12,
  },
  innerModalContainer: {
    flex: 1,
    padding: '6%',
    maxHeight: '100%'
  },
  gradientOne: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    minHeight: 400,
    maxHeight: 730,
    height: 'auto',
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginVertical: '3%',
  },
  modalItem: {
    paddingVertical: ' 5%',
    flexDirection: 'row',
  },
  checkImage: {
    width: 25,
    height: 25,
    marginRight: '5%',
  },
  modalDescription: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
  modalDescriptionTime: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 10,
    fontWeight: 'bold',
    marginVertical: '2%',
  },
  modalDescriptionText: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'justify',
    paddingRight: '10%',
    lineHeight: 21,
    marginBottom: '2%',
  },
  modalDescriptionLocation: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'justify',
    lineHeight: 13,
  },
});
