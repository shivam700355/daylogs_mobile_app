import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Image, Text, TouchableOpacity, Modal, ActivityIndicator, ScrollView, RefreshControl, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatus, StatusResponse, EmployeeStatusData } from '../components/Api/StatusApi';
import { checkinApi, checkoutApi, CheckinRequest, CheckoutRequest } from '../components/Api/CheckInCheckOutApi';
import { getUserSession, UserSessionResponse } from '../components/Api/LoginApi';
import { addWorkingStatus } from '../components/Api/StatusList';
import * as Location from 'expo-location';
import Loader from './Loader';
import Toast from 'react-native-toast-message';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const Dashboard = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [statusDisplayData, setStatusDisplayData] = useState<EmployeeStatusData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const BASE_URL = 'https://localhost:8080/employee/app-assets/images/profile/';
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [action, setAction] = useState<'checkin' | 'checkout'>('checkin');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [attendenceId, setAttendenceId] = useState<string | null>(null);
  const [hIndex, setHIndex] = useState<number>(5);
  const [customStatus, setCustomStatus] = useState('');
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const [statusData, setStatusData] = useState({
    working_status: 'Working',
    break_status: 'Working',
  });

  const [previousWorkingStatus, setPreviousWorkingStatus] = useState('Working'); // Track previous working status
  useEffect(() => {
    const checkSession = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');

        if (!userDataString) {
          router.replace('/');
          return;
        }

        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        setUserId(parsedUserData.id);
        setToken(parsedUserData.token);

        // Fetch user session data
        if (parsedUserData.id && parsedUserData.token) {
          const sessionResponse: UserSessionResponse = await getUserSession(parsedUserData.id, parsedUserData.token);

          if (sessionResponse.code === 200) {
            setUserData(parsedUserData);
            setUserId(parsedUserData.id);
            setToken(parsedUserData.token);
          } else {
            router.replace('/');
          }
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const updateStatus = async (workingStatus: string, breakStatus: string) => {
    setLoading(true);
    try {
      const data = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      const userdata = JSON.parse(data);
      const userId = userdata.id;
      const companyId = userdata.cid;
      const response = await addWorkingStatus(companyId, userId, workingStatus, breakStatus, token);

      if (response.code === 200) {
        setStatusData(prev => ({
          ...prev,
          working_status: workingStatus,
          break_status: breakStatus,
        }));
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('An error occurred while updating the status.');
    } finally {
      await sleep(800);
      setLoading(false);
    }
  };

  const handleTakeBreak = () => {
    if (statusData.break_status === 'Working') {
      setPreviousWorkingStatus(statusData.working_status);
      updateStatus('On Break', 'On Break');
    } else {
      updateStatus(previousWorkingStatus, 'Working');
    }
    fetchStatusData();
  };

  const handleMeetingStatus = async () => {
    if (statusData.working_status === 'Meeting') {
      updateStatus(previousWorkingStatus, statusData.break_status);
      setPreviousWorkingStatus('Working');
    } else {
      setPreviousWorkingStatus(statusData.working_status);
      updateStatus('Meeting', statusData.break_status);
    }
    fetchStatusData();
  };

  const handleCustomStatus = async () => {
    const normalizedStatus = customStatus.trim().replace(/\s+/g, ' ');
    if (normalizedStatus === '') {
      Alert.alert('Validation Error', 'Custom Status is required');
      return;
    }
    try {
      await updateStatus(normalizedStatus, statusData.break_status);
      setCustomStatus('');
      setCustomModalVisible(false);
      fetchStatusData();
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the status.');
      console.error('Update Status Error:', error);
    }
  };



  const fetchStatusData = async () => {
    setLoading(true);
    try {
      const data = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      if (data && token) {
        const userdata = JSON.parse(data);
        const response: StatusResponse = await getStatus(parseInt(userdata.id), token);
        if (response.code === 200) {
          setStatusDisplayData(response.data || null);
          setAttendenceId(response.data?.att_id)
        } else {
          setError(response.message);
        }
      } else {
        setError('User ID or token is missing');
      }
    } catch (error) {
      setError('Failed to fetch status data');
    } finally {
      await sleep(800);
      setLoading(false);
    }
  };
  const getPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Please grant location permissions.");
      return;
    }
    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      console.log("Location:", currentLocation);
    } catch (error) {
      Alert.alert("Error", "Failed to get current location.");
      console.error(error);
    }
  };

  const reverseGeocode = async () => {
    if (!location) {
      Alert.alert("Error", "Location not available.");
      return;
    }

    try {
      const reverseGeocodedAddresses = await Location.reverseGeocodeAsync({
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
      });
      if (reverseGeocodedAddresses.length > 0) {
        const formattedAddress = reverseGeocodedAddresses[0]?.formattedAddress ||
          `${reverseGeocodedAddresses[0].name}, ${reverseGeocodedAddresses[0].city}, ${reverseGeocodedAddresses[0].region}, ${reverseGeocodedAddresses[0].country}`;
        setAddress(formattedAddress);
        console.log("Address:", formattedAddress);
      } else {
        Alert.alert("Error", "No address found for the current location.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to reverse geocode.");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchStatusData();
    getPermissions();
  }, []);

  useEffect(() => {
    if (location) {
      reverseGeocode();
    }
  }, [location]);

  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('userData');
      if (user) {
        const userdata = JSON.parse(user);
        setUserData(userdata);
        setUserId(userdata.id);
        setCompanyId(userdata.cid);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };
  useEffect(() => {
    if (statusDisplayData?.checkin_time && statusDisplayData.checkin_time !== '00:00:00') {
      setCanCheckIn(false);  // Disable check-in after it's done
      setCanCheckOut(true);   // Enable check-out if check-in is done
    } else {
      setCanCheckIn(true);    // Enable check-in if not done or it's 00:00:00
      setCanCheckOut(false);  // Disable check-out if not checked in
    }

    // Handle check-out logic
    if (statusDisplayData?.checkout_time && statusDisplayData.checkout_time !== '00:00:00') {
      setCanCheckOut(false);  // Disable check-out if it's done
    }
  }, [statusDisplayData]);
  const handleCheckIn = async () => {
    if (!location || !address) {
      Alert.alert("Error", "Location and address are required.");
      return;
    }

    const requestData: CheckinRequest = {
      action: 'checkin',
      user_id: userId,
      company_id: companyId,
      address: address,
      lat_long: `${location.coords.latitude},${location.coords.longitude}`,
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await checkinApi(requestData, token);
        if (response.code === 200) {
          setModalVisible(false);  // Ensure the modal closes
          Toast.show({
            type: 'success',
            text1: 'Check-in Successful',
            text2: 'You have successfully checked in!',
            position: 'top',
            visibilityTime: 1000,
          });
          setCanCheckIn(false);  // Disable check-in button
          setCanCheckOut(true);   // Enable check-out button
          fetchStatusData();      // Fetch updated status
        } else if (response.message === "Attendance already marked") {
          Toast.show({
            type: 'info',
            text1: 'Check-in Already Done',
            text2: 'You have already checked in for the day.',
            position: 'top',
            visibilityTime: 1000,
          });
          setModalVisible(false);  // Close the modal if check-in is already done
        } else {
          Alert.alert("Error", response.message);
        }
      } else {
        Alert.alert("Error", "User token not found.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to check in.");
      console.error(error);
    }
  };

  const handleCheckOut = async () => {
    if (!location || !address) {
      Alert.alert("Error", "Location and address are required.");
      return;
    }

    const requestData: CheckoutRequest = {
      action: 'checkout',
      user_id: userId,
      company_id: companyId,
      attendance_id: attendenceId,
      address: address,
      lat_long: `${location.coords.latitude},${location.coords.longitude}`,
      h_index: hIndex,
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await checkoutApi(requestData, token);
        if (response.code === 200) {
          setHIndex(5);
          setModalVisible(false);  // Ensure the modal closes
          Toast.show({
            type: 'success',
            text1: 'Check-out Successful',
            text2: 'You have successfully checked out!',
            position: 'top',
            visibilityTime: 1000,
          });
          setCanCheckOut(false);   // Disable check-out button
          fetchStatusData();       // Fetch updated status
        } else {
          Alert.alert("Error", response.message);
        }
      } else {
        Alert.alert("Error", "User token not found.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to check out.");
      console.error(error);
    }
  };
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      return "Good Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      return "Good Afternoon";
    } else if (currentHour >= 17 && currentHour < 21) {
      return "Good Evening";
    } else if (currentHour >= 21 && currentHour < 24) {
      return "Good Night";
    } else {
      return "have a Nice Day !";
    }
  };
  const renderEmoji = (index) => {
    switch (index) {
      case 5: return '🥳';
      case 4: return '😃';
      case 3: return '🙂';
      case 2: return '🙁';
      case 1: return '😣';
      default: return '☆';
    }
  };
  const getTooltipMessage = (index) => {
    const messages = [
      'Exhausting',
      'Tiring',
      'Okay',
      'Good',
      'Great'
    ];
    return messages[index - 1]; // Adjust for zero-based index
  }
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStatusData();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <Loader />
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
        style={styles.gradient}
      />
      <Toast />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}  />}
      >
        <View style={styles.innerContainer}>
          <LinearGradient
            colors={['#42435E', '#43ADCE']}
            style={styles.gradientOne}
          >
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => { router.navigate('/Profile') }}>
                  <Image
                    source={
                      userData?.pic
                        ? { uri: `${BASE_URL}${userData.pic}` }
                        : require('../assets/images/icon.png')
                    }
                    style={styles.profilePic}
                  />
                </TouchableOpacity>
                <View style={styles.notificationContainer}>
                  <TouchableOpacity><Ionicons name="notifications" size={25} color="white" /></TouchableOpacity>
                </View>
              </View>
              <Text style={styles.hiText}>Hi, {userData?.name || 'User'} !</Text>
              <Text style={styles.text}>{getGreeting()}</Text>
              <View style={styles.checkContainer}>
                <View>

                  <TouchableOpacity
                    style={[styles.checkTouch, !canCheckIn && { opacity: 0.5 }]}  // Disable visual cue
                    onPress={() => {
                      if (canCheckIn) {
                        setAction('checkin');
                        setModalVisible(true);
                      } else {
                        Toast.show({
                          type: 'info',
                          text1: 'Check-In Error',
                          text2: 'You have already checked in for the day.',
                        });
                      }
                    }}
                    disabled={!canCheckIn}  // Disable the button
                  >
                    <Image
                      source={require('../assets/images/check-in.png')}
                      style={styles.checkImage}
                    />
                    <Text style={styles.checkText}>Check in</Text>
                  </TouchableOpacity>
                  <Text style={styles.inTimeText}>{statusDisplayData?.checkin_time || '--:--'}</Text>
                </View>
                <Text style={styles.date}>{statusDisplayData?.current_day || '----'}</Text>
                <View>
                  <TouchableOpacity
                    style={[styles.checkTouch, !canCheckOut && { opacity: 0.5 }]}  // Disable visual cue
                    onPress={() => {
                      if (canCheckOut) {
                        setAction('checkout');
                        setModalVisible(true);
                      } else {
                        Toast.show({
                          type: 'info',
                          text1: 'Check-Out Error',
                          text2: canCheckIn
                            ? 'You need to check in before checking out.'
                            : 'You have already checked out for the day.',
                        });
                      }
                    }}
                    disabled={!canCheckOut}
                  >
                    <Image
                      source={require('../assets/images/check-out.png')}
                      style={styles.checkImage}
                    />
                    <Text style={styles.checkText}>Check out</Text>
                  </TouchableOpacity>
                  <Text style={styles.outTimeText}>{statusDisplayData?.checkout_time || '--:--'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.statusTab}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  style={[
                    styles.fabIconBreak,
                    statusData.break_status === 'Working' ? styles.fabIconBreak : styles.breakIcon,
                    statusData.working_status === 'Meeting' && styles.disabledButton, // Disable when in meeting
                  ]}
                  onPress={handleTakeBreak}
                  disabled={statusData.working_status === 'Meeting' || loading} // Disable during meeting
                >
                  <Text style={styles.fabText}>
                    {statusData.break_status === 'Working' ? 'Break' : 'Stop Break'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleMeetingStatus}
                  style={[
                    styles.fabIconBreak,
                    statusData.working_status === 'Meeting' ? styles.meetingIcon : styles.fabIconBreak,
                    statusData.break_status === 'On Break' && styles.disabledButton, // Disable when on break
                  ]}
                // disabled={statusData.break_status === 'On Break' || loading} // Disable during break
                >
                  <Text style={[styles.fabText, statusData.break_status === 'On Break' && styles.disabledText]}>
                    {statusData.working_status === 'Meeting' ? 'Meeting' : 'Meeting'}
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.fabIconInUse,
                    (statusData.break_status === 'On Break' || statusData.working_status === 'Meeting') && styles.disabledButton, // Disable when on break or meeting
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => setCustomModalVisible(true)}
                    disabled={statusData.break_status === 'On Break' || statusData.working_status === 'Meeting' || loading} // Disable during break or meeting
                  >
                    <Text style={[styles.fabTextInUse, (statusData.break_status === 'On Break' || statusData.working_status === 'Meeting') && styles.disabledText]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{statusDisplayData?.working_status || statusDisplayData?.break_status}</Text>
                <Text style={styles.statusTime}>{statusDisplayData?.working_date},{statusDisplayData?.working_time}</Text>
              </View>
            </View>
            <View style={styles.iconContainer}>
              <View style={styles.rowIcon}>
                <TouchableOpacity onPress={() => { router.navigate('/Attendance') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/Attendance.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.navigate('/DailyWork') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/DailyWork.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Daily Work</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.navigate('/Status') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/Status.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Status</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.rowIcon}>
                <TouchableOpacity onPress={() => { router.navigate('/Request') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/Request.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Request</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.navigate('/Holidays') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/Holidays.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Holidays</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.navigate('/Team') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/Team.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Team</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.rowIcon}>
                <TouchableOpacity onPress={() => { router.navigate('/Announcement') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/Notice.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Announcement</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.navigate('/Document') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/Document.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Document</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.navigate('/MyReview') }}>
                  <View style={styles.icon}>
                    <Image source={require('../assets/images/Review.png')} style={styles.iconPic} />
                  </View>
                  <Text style={styles.iconText}>Reviews</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
      <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => { setModalVisible(false), setHIndex(5) }} style={styles.modalHeaderContainer}>
              <FontAwesome name="chevron-left" size={24} color="#43adce" />
              <Text style={styles.modalHeader}>Attendance Log</Text>
            </TouchableOpacity>
            <View>
              {address && <Text>Address: {address}</Text>}
              {location && (
                <>
                  <Text>Latitude: {location.coords.latitude}</Text>
                  <Text>Longitude: {location.coords.longitude}</Text>
                </>
              )}
              {action === 'checkout' && (
                <View style={styles.HIndexContainer}>
                  <Text style={styles.HIndexText}>How was your day?</Text>
                  <View style={styles.emojiContainer}>
                    {[1, 2, 3, 4, 5].map((index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setHIndex(index);
                          setTooltipMessage(getTooltipMessage(index));
                          setTimeout(() => {
                            setTooltipMessage('');
                          }, 1500);
                        }}
                      >
                        <Text style={[
                          styles.emoji,
                          index === hIndex ? styles.selectedEmoji : styles.blurredEmoji
                        ]}>
                          {renderEmoji(index)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {tooltipMessage && (
                    <View style={styles.tooltipContainer}>
                      <Text style={styles.tooltipText}>
                        <AntDesign name="infocirlceo" size={14} color='#fff' />  {tooltipMessage}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.modalClick} onPress={action === 'checkin' ? handleCheckIn : handleCheckOut}>
              <Text style={styles.modalTitle}>{action === 'checkin' ? 'Check in' : 'Check out'}</Text>

            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <Modal
        visible={customModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.customStatusBackground}>
          <View style={styles.customStatusContainer}>
            <Text style={styles.customStatusText}>Custom Status</Text>
            <TextInput
              placeholder="Enter Custom Status"
              value={customStatus}
              onChangeText={setCustomStatus}
              style={styles.input}
              multiline
              numberOfLines={6}
            />
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.customDismissButton} onPress={() => { setCustomModalVisible(false) }}>
                <Text style={styles.customButtonText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.customButton} onPress={handleCustomStatus} >
                <Text style={styles.customButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF0F4',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    justifyContent: 'center'
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 240,
  },
  gradientOne: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 270,
    borderRadius: 12,
  },
  innerContainer: {
    width: '95%',
    alignSelf: 'center',
    borderRadius: 12,
    position: 'absolute',
    top: '5%',
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 50,
    marginLeft: 22,
    marginTop: 15,
    resizeMode: 'cover',
  },
  notificationContainer: {
    height: 50,
    width: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF33',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginRight: 20,
  },
  hiText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 10,
  },
  text: {
    color: '#FFFFFF',
    opacity: 0.7,
    marginLeft: 20,
    fontSize: 16,
  },
  checkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    height: '35%',
    marginTop: 20,
    backgroundColor: '#FFFFFF4D',
    borderWidth: 1.5,
    borderColor: '#FFFFFF33',
    borderRadius: 12,
    alignSelf: 'center',
    padding: 10,
  },
  checkImage: {
    alignSelf: 'center',
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  checkTouch: {
    alignSelf: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  inTimeText: {
    color: '#216D0D',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  outTimeText: {
    color: '#FF0000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  date: {
    color: '#FFFFFF',
    alignSelf: 'center',
  },
  iconContainer: {
    marginTop: '35%',
  },
  rowIcon: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: '4%',
    alignItems:'center',
  },
  icon: {
    backgroundColor: '#76BBD033',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14%',
    borderRadius: 14,
    width: 60,
    height: 60,
  },
  iconPic: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  iconText: {
    fontSize: 12,
    color: '#292825',
    alignSelf: 'center',
    fontWeight: 'bold',
    paddingVertical: '2%'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    height: '70%',
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: '5%'
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    paddingVertical: '8%',
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    color: '#43ADCE',
    fontWeight: 'bold',
    marginLeft: '2%',
  },
  modalClick: {
    width: '95%',
    paddingVertical: '4%',
    borderRadius: 100,
    backgroundColor: '#43ADCE',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'absolute',
    bottom: '5%',
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  HIndexContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  HIndexText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 30,
    margin: 5,
  },
  selectedEmoji: {
    fontSize: 40,
    opacity: 1,
  },
  blurredEmoji: {
    opacity: 0.3,
  },
  modalTitle: {
    fontSize: 16,
    color: '#FEFEFE',
    fontWeight: 'bold',
  },
  statusTab: {
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    elevation: 2,
    paddingVertical: '1%',
    top: '105%'
  },
  fabIcon: {
    backgroundColor: '#f2f2f2',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    marginHorizontal: '2%',
    marginVertical: '1%',
  },
  breakIcon: {
    backgroundColor: '#FFDAD5',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    marginHorizontal: '2%',
    marginVertical: '1%',
  },
  meetingIcon: {
    backgroundColor: '#d3edd4',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    marginHorizontal: '2%',
    marginVertical: '1%',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#f2f2f2',
  },
  disabledText: {
    color: 'grey',
  },
  fabIconInUse: {
    backgroundColor: '#FFFFFF',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    marginHorizontal: '2%',
    marginVertical: '1%',
    elevation: 1,
  },
  fabIconBreak: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    marginHorizontal: '2%',
    marginVertical: '1%',
  },
  fabTextInUse: {
    color: "#43ADCE"
  },
  fabText: {
    color: "#868686"
  },
  customStatusBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  customStatusContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
  },
  customStatusText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
    marginVertical: '3%',
    marginHorizontal: '5%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E4E9',
    borderWidth: 1,
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
    marginVertical: '5%',
    padding: '5%',
    paddingBottom:'20%',
    textAlignVertical: 'top',
    color: '#7A849C',
    fontSize: 14,

  },
  customDismissButton: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#FFDAD5',
    width: '50%',
    paddingVertical: '3%'
  },
  customButton: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#43ADCE33',
    width: '50%',
    paddingVertical: '3%'
  },
  customButtonText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 29,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  statusContainer: {
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    marginVertical: '2%',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#32333E',
    marginHorizontal: '5%',
    marginVertical: '1%',
    flexDirection: 'row',
  },
  statusTime: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#43ADCE',
    marginHorizontal: '5%',
  },
  tooltipContainer: {
    padding: 10,
    borderRadius: 25,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9933ff',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
