import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, TextInput, Linking, Dimensions, Animated, ScrollView, Platform, } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, Feather, MaterialIcons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from './Loader';
import { getUserProfile, logoutUser, updateProfilePic } from '../components/Api/ProfileApi';
import { changePassword } from '../components/Api/ChangePassword';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const { width } = Dimensions.get('window');

export default function ProfilePage() {
    const [currentTab, setCurrentTab] = useState<'myProfile' | 'companyProfile'>('myProfile');
    const animation = useRef(new Animated.Value(0)).current;
    const scrollView = useRef(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [oldPassword, setOldPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [loggingOut, setLoggingOut] = useState<boolean>(false);
    const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [profilePicLoading, setProfilePicLoading] = useState<boolean>(false);

    const router = useRouter();
    const BASE_URL = 'https://daylogs.in/employee/app-assets/images/profile/';

    // Fetch user profile data from the API
    const fetchUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const user = await AsyncStorage.getItem('userData');
            if (!user || !token) throw new Error('User data or token not found.');

            const parsedUser = JSON.parse(user);
            const response = await getUserProfile(parsedUser.id, token);

            if (response.code === 200) {
                setUserData(response.data);
            } else {
                setError('Failed to fetch user profile.');
            }
        } catch (error) {
            setError('Failed to load user data.');
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleDocumentPick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true,
            quality: 1,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Image = result.assets[0].base64;
            console.log('Base64 Image:', base64Image);

            try {
                setProfilePicLoading(true); // Start loader
                const userDataString = await AsyncStorage.getItem('userData');

                if (!userDataString) {
                    throw new Error('No user data found in AsyncStorage.');
                }

                const userData = JSON.parse(userDataString);
                const token = userData.token;

                if (!token) {
                    throw new Error('User token not found.');
                }

                // Update profile picture
                const response = await updateProfilePic(userData.id, token, base64Image);

                if (response.code === 200) {
                    Toast.show({
                        type: 'success',
                        text1: 'Profile Updated',
                        text2: 'Your profile picture has been updated.',
                        visibilityTime: 2000,
                    });
                    fetchUserData(); // Refresh the profile data
                } else {
                    throw new Error(response.message || 'Failed to update profile picture.');
                }
            } catch (error) {
                console.error('Error updating profile picture:', error.message || error);
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: 'Failed to update profile picture.',
                    position: 'top',
                    visibilityTime: 2000,
                });
            } finally {
                setProfilePicLoading(false); // Stop loader
            }
        }
    };
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            setError('Please enter both old and new passwords.');
            return;
        }

        try {
            setSubmitting(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('User token not found.');

            const response = await changePassword(userData?.u_id, oldPassword, newPassword, token);
            if (response.code === 200) {
                Toast.show({
                    type: 'success',
                    text1: 'Password Changed',
                    text2: 'Your password has been successfully updated.',
                    position: 'top',
                    visibilityTime: 2000,
                });
                setError(null);
                setModalVisible(false);
                setOldPassword('');
                setNewPassword('');
            } else {
                setError(response.message);
                Toast.show({
                    type: 'error',
                    text1: 'Password Change Failed',
                    text2: response.message,
                    position: 'top',
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.error('Change password error:', error);
            setError('Something went wrong. Please try again.');
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong. Please try again.',
                position: 'top',
                visibilityTime: 2000,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('User token not found.');

            const response = await logoutUser(userData?.u_id, token);
            if (response.code === 200 && response.data) {
                await AsyncStorage.removeItem('userToken');
                setLoggingOut(false);
                router.replace('/');
                Toast.show({
                    type: 'success',
                    text1: 'Logged out',
                    text2: 'You have been logged out successfully.',
                    visibilityTime: 2000,
                });
            } else {
                setError('Failed to log out.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            setLoggingOut(false);
            Toast.show({
                type: 'error',
                text1: 'Logout Failed',
                text2: 'Something went wrong. Please try again.',
                visibilityTime: 2000,
            });
        } finally {
            setLoggingOut(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleHelpClick = () => {
        Linking.openURL('https://daylogs.in/#contact');
    };
    const handleEmailClick = () => {
        if (userData.email) {
            const emailUrl = `mailto:${userData.email}`;
            Linking.openURL(emailUrl).catch(err => console.error('Error opening email client:', err));
        } else {
            console.log('Email not available');
        }
    };
    const handlePhoneClick = () => {
        if (userData.mobile) {
            const phoneUrl = `tel:${userData.mobile}`;
            Linking.openURL(phoneUrl).catch(err => console.error('Error opening phone dialer:', err));
        } else {
            console.log('Phone number not available');
        }
    };
    const handleWebsiteClick = () => {
        if (userData.website) {
            Linking.openURL(userData.website);
        } else {
            console.log('Website URL not available');
        }
    };
    const handleAddressClick = () => {
        if (userData.address) {
            const addressQuery = encodeURIComponent(userData.address);
            const url = Platform.select({
                ios: `maps:0,0?q=${addressQuery}`,
                android: `geo:0,0?q=${addressQuery}`,
            });

            if (url) {
                Linking.openURL(url).catch(err => console.error('Error opening maps:', err));
            }
        } else {
            console.log('Address not available');
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }
    const myProfileTabPress = () => {
        scrollView.current.scrollTo({ x: 0 });
        setCurrentTab('myProfile');
    };

    const companyProfileTabPress = () => {
        scrollView.current.scrollTo({ x: width });
        setCurrentTab('companyProfile');
    };

    const myProfileColorInterpolate = animation.interpolate({
        inputRange: [0, width],
        outputRange: ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)'],
    });

    const companyProfileColorInterpolate = animation.interpolate({
        inputRange: [0, width],
        outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
                style={styles.gradient}
            />
            <TouchableOpacity style={styles.header} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#32333E" />
            </TouchableOpacity>
            <Toast />
            {userData && (
                <>
                    <View style={styles.profileContainer}>
                        <TouchableOpacity onPress={handleDocumentPick}>
                            <View style={styles.profilePicWrapper}>
                                <Image
                                    source={
                                        userData?.u_pic
                                            ? { uri: `${BASE_URL}${userData.u_pic}` }
                                            : require('../assets/images/icon.png')
                                    }
                                    style={styles.profilePic}
                                />
                                <TouchableOpacity style={styles.profilePicEditIcon} onPress={handleDocumentPick}>
                                    <Ionicons name="camera-outline" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                        {profilePicLoading && (
                            <ActivityIndicator size="small" color="#000" style={styles.loader} />
                        )}
                        <Text style={styles.userName}>{userData.u_name}</Text>
                        <Text style={styles.userRole}>{userData.u_designation}</Text>
                    </View>
                </>
            )}
            <View style={styles.tabContainer}>
                <Animated.View style={[styles.tabOne, { backgroundColor: myProfileColorInterpolate }]}>
                    <Text style={styles.tabText} onPress={myProfileTabPress}>My Profile</Text>
                </Animated.View>
                <Animated.View style={[styles.tabTwo, { backgroundColor: companyProfileColorInterpolate }]}>
                    <Text style={styles.tabText} onPress={companyProfileTabPress}>Company Profile</Text>
                </Animated.View>
            </View>

            <ScrollView
                ref={scrollView}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: animation } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* My Profile Section */}
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.contentContainer}>
                        {userData && (
                            <>
                                <View style={styles.infoContainer}>
                                    <View style={styles.iconContainer}><FontAwesome name="id-badge" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Employee Id</Text>
                                        <Text style={styles.infoText}>{userData.abb_name}-{userData.u_id.toString().padStart(4, '0')}</Text>
                                    </View>
                                </View>
                                <View style={styles.infoContainer}>
                                    <View style={styles.iconContainer}><Ionicons name="call-outline" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Mobile</Text>
                                        <Text style={styles.infoText}>{userData.u_mobile}</Text>
                                    </View>
                                </View>
                                <View style={styles.infoContainer}>
                                    <View style={styles.iconContainer}><Feather name="mail" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Email</Text>
                                        <Text style={styles.infoText}>{userData.u_email}</Text>
                                    </View>
                                </View>
                                <View style={styles.infoContainer}>
                                    <View style={styles.iconContainer}><Feather name="settings" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Settings</Text>
                                        <Text style={styles.infoText}>Manage Notifications</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handleHelpClick} style={styles.infoContainer}>
                                    <View style={styles.iconContainer}><Feather name="help-circle" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Help</Text>
                                        <Text style={styles.infoText}>Get Instant Help</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.infoContainer} onPress={() => setModalVisible(true)}>
                                    <View style={styles.iconContainer}><MaterialIcons name="password" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Change Password</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.infoContainer} onPress={handleLogout}>
                                    <View style={styles.iconContainer}><MaterialIcons name="logout" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Logout</Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
                {/* Company Profile Section */}
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.contentContainer}>
                        {userData && (
                            <>
                                <View style={styles.infoContainer}>
                                    <View style={styles.iconContainer}><MaterialCommunityIcons name="office-building-outline" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>{userData.name}</Text>
                                        <Text style={styles.infoText}>{userData.type}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handlePhoneClick} style={styles.infoContainer}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="call-outline" size={24} color="#191D28" />
                                    </View>
                                    <View>
                                        <Text style={styles.infoHeading}>Mobile</Text>
                                        <Text style={styles.infoText}>{userData.mobile}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleEmailClick} style={styles.infoContainer}>
                                    <View style={styles.iconContainer}>
                                        <Feather name="mail" size={24} color="#191D28" />
                                    </View>
                                    <View>
                                        <Text style={styles.infoHeading}>Email</Text>
                                        <Text style={styles.infoText}>{userData.email}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleWebsiteClick} style={styles.infoContainer}>
                                    <View style={styles.iconContainer}><MaterialCommunityIcons name="web" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Website</Text>
                                        <Text style={styles.infoText}>{userData.website}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAddressClick} style={styles.infoContainer}>
                                    <View style={styles.iconContainer}><Entypo name="location" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Address</Text>
                                        <Text style={styles.infoText}>{userData.address}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.infoContainer} onPress={handleLogout}>
                                    <View style={styles.iconContainer}><MaterialIcons name="logout" size={24} color="#191D28" /></View>
                                    <View>
                                        <Text style={styles.infoHeading}>Logout</Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            </ScrollView>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <LinearGradient colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']} style={styles.gradient} />
                    <TouchableOpacity style={styles.back} onPress={() => setModalVisible(false)}>
                        <Ionicons name="chevron-back" size={24} color="#2E3735" />
                    </TouchableOpacity>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Old Password"
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                secureTextEntry={!showOldPassword}
                            />
                            <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                                <Ionicons
                                    name={showOldPassword ? 'eye' : 'eye-off'}
                                    size={24}
                                    color="#191D28"
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons
                                    name={showNewPassword ? 'eye' : 'eye-off'}
                                    size={24}
                                    color="#191D28"
                                />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleChangePassword}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Change Password</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

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
        paddingHorizontal: '4%',
        paddingTop: '10%',
        paddingBottom: '2%',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
    loader: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    profileContainer: {
        alignItems: 'center',
        marginVertical: '4%',
    },
    profilePic: {
        width: 90,
        height: 90,
        borderRadius: 50,
        resizeMode: 'cover',
    },
    profilePicWrapper: {
        position: 'relative',
        width: 90,
        height: 90,
    },
    profilePicEditIcon: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#43ADCE',
        borderRadius: 20,
        padding: 4,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#191D28',
    },
    userRole: {
        fontSize: 14,
        color: '#666666',
        fontWeight: '500',
    },
    tabContainer: {
        flexDirection: 'row',
        marginVertical: '2%',
        alignSelf: 'center',
        borderRadius: 10,
        backgroundColor: '#9DA1A533',
    },
    tabOne: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: '3%',
        paddingHorizontal: '10%',
        borderRadius: 10,
    },
    tabTwo: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: '3%',
        paddingHorizontal: '10%',
        borderRadius: 10,
    },
    tabText: {
        color: '#868686',
        fontSize: 12,
        fontWeight: 'bold',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    contentContainer: {
        width,
        paddingHorizontal: '2%',
        paddingVertical: '2%',
    },
    infoContainer: {
        flexDirection: 'row',
        marginHorizontal: '8%',
        marginVertical: '5%',
        alignItems: 'center',
    },
    iconContainer: {
        width: '12%'
    },
    infoHeading: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#191D28',
        marginVertical: '1%',
    },
    infoText: {
        fontSize: 12,
        color: '#666666',
        fontWeight: '500',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: '#EBF0F4',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 10,
        paddingVertical: '5%',
        paddingHorizontal: '5%',
        alignSelf: 'center',
        marginTop: '30%',
    },
    back: {
        paddingHorizontal: '2%',
        paddingVertical: '4%'
    },
    modalTitle: {
        fontSize: 24,
        color: '#222222',
        fontWeight: 'bold',
        marginBottom: 15,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        marginVertical: '5%',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#222222',
        paddingHorizontal: '4%',
        paddingVertical: '3%',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
