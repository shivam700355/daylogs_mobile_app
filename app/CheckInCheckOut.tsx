import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Alert, RefreshControl, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { checkinApi, checkoutApi, CheckinRequest, CheckoutRequest } from '../components/Api/CheckInCheckOutApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatus, StatusResponse, EmployeeStatusData } from '../components/Api/StatusApi';
import Loader from './Loader';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const CheckInCheckOut = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [action, setAction] = useState<'checkin' | 'checkout'>('checkin');
    const [userId, setUserId] = useState<number | null>(null);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [hIndex, setHIndex] = useState<number>(1); // Default hIndex to 1
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [tooltipMessage, setTooltipMessage] = useState('');

    const getPermissions = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "Please grant location permissions.");
            return;
        }
        try {
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
           
        } catch (error) {
            Alert.alert("Error", "Failed to get current location.");
      
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
            } else {
                Alert.alert("Error", "No address found for the current location.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to reverse geocode.");
          
        }
    };

    const handleCheckIn = async () => {
        if (!location || !address) {
            Alert.alert("Error", "Location, address, user ID, or company ID is not available.");
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
                    Alert.alert("Success", "Checked in successfully.");
                    console.log("Check-in Response:", response);
                    setModalVisible(false);
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
            Alert.alert("Error", "Location, address, user ID, or company ID is not available.");
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
                    Alert.alert("Success", "Checked out successfully.");
                    console.log("Check-out Response:", response);
                    setModalVisible(false);
                    setHIndex(5);
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

    const renderEmoji = (index) => {
        switch (index) {
            case 5: return '🥳';
            case 4: return '😃';
            case 3: return '🙂';
            case 2: return '🙁';
            case 1: return '😣';
            default: return '☆'; // Default star if no emoji is selected
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
        return messages[index - 1]; // Adjust for zero-based index
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await getPermissions(); // Refresh location permission
        setRefreshing(false);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await AsyncStorage.getItem('userData');
                if (data) {
                    const user = JSON.parse(data);
                    setUserId(user.id);
                    setCompanyId(user.cid);
                }
            } catch (error) {
                Alert.alert("Error", "Failed to get user data.");
              
            }
        };

        fetchUserData();
        getPermissions();
    }, []);

    useEffect(() => {
        if (location) {
            reverseGeocode();
        }
    }, [location]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.checkContainer}>
                <TouchableOpacity style={styles.checkTouch} onPress={() => { setAction('checkin'); setModalVisible(true); }}>
                    <Text style={styles.checkText}>Check in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.checkTouch} onPress={() => { setAction('checkout'); setModalVisible(true); }}>
                    <Text style={styles.checkText}>Check out</Text>
                </TouchableOpacity>
            </View>

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
                                                <AntDesign name="infocirlceo" size={14} color='#fff' /> {tooltipMessage}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={action === 'checkin' ? handleCheckIn : handleCheckOut} style={styles.submitButton}>
                            <Text style={styles.submitButtonText}>{action === 'checkin' ? 'Check in' : 'Check out'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    checkContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 20,
    },
    checkTouch: {
        backgroundColor: '#43adce',
        padding: 20,
        borderRadius: 10,
    },
    checkText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
    },
    submitButton: {
        backgroundColor: '#43adce',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        fontSize: 18,
        textAlign: 'center',
    },
    HIndexContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    HIndexText: {
        fontSize: 16,
        marginBottom: 10,
    },
    emojiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
    },
    emoji: {
        fontSize: 40,
    },
    selectedEmoji: {
        fontSize: 45,
        color: 'blue',
    },
    blurredEmoji: {
        opacity: 0.3,
    },
    tooltipContainer: {
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    tooltipText: {
        color: '#fff',
    },
});

export default CheckInCheckOut;
