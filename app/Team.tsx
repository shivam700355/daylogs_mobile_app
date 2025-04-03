import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, FlatList, Image, Modal, TextInput, RefreshControl, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getTeamList, TeamMember, TeamListResponse } from '../components/Api/TeamApi';
import { addReview, AddReviewResponse } from '../components/Api/PostReviewApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from './Loader';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"; 
const TeamMembers = () => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [modalVisibleReview, setModalVisibleReview] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [reviewText, setReviewText] = useState<string>('');
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const BASE_URL = 'https://daylogs.in/employee/app-assets/images/profile/';

    const fetchTeamMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');

            if (data && token) {
                const userId = JSON.parse(data).id;
                const companyId = JSON.parse(data).cid;

                const response: TeamListResponse = await getTeamList(companyId, userId, token);
                if (response.code === 200) {
                    setTeamMembers(response.data || []);
                } else {
                    setError(response.message);
                }
            } else {
                setError('User data or token not found.');
            }
        } catch (err) {
            setError('An error occurred while fetching the team member list.');
        } finally {
            await sleep(800);
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTeamMembers();
    }, []);

    const handleMemberPress = (member: TeamMember) => {
        setSelectedTeamMember(member);
        setModalVisible(true);
    };

    const filteredTeamMembers = teamMembers.filter(member =>
        member.u_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.u_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.u_designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.u_mobile.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.u_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.u_work_station.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.u_pincode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearchPress = () => {
        setShowSearchBar(!showSearchBar);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatRating = (rating: string) => {
        const numericRating = parseFloat(rating);
        const fullStars = Math.floor(numericRating);
        const halfStarExists = numericRating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStarExists ? 1 : 0);

        return (
            <>
                {Array(fullStars).fill(null).map((_, index) => (
                    <Image key={`full-${index}`} source={require('../assets/images/Star.png')} />
                ))}
                {halfStarExists && <Image source={require('../assets/images/Halfstar.png')} />}
                {Array(emptyStars).fill(null).map((_, index) => (
                    <Image key={`empty-${index}`} source={require('../assets/images/EmptyStar.png')} />
                ))}
            </>
        );
    };
    const resetForm = () => {
        setReviewText('');
        setRating(0);
        setSelectedTeamMember(null);
    };

    const handleRatingChange = (newRating: number) => {
        setRating(newRating);
    };

    const handleSubmit = async () => {
        if (!selectedTeamMember) {
            Alert.alert('Error', 'Please select a team member');
            return;
        }
        if (rating === 0) {
            Alert.alert('Error', 'Please rate the team member');
            return;
        }
        if (!reviewText) {
            Alert.alert('Error', 'Please write a review');
            return;
        }

        try {
            const data = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');
            if (data && token) {
                const userId = JSON.parse(data).id;
                const companyId = JSON.parse(data).cid;

                const response: AddReviewResponse = await addReview(
                    companyId,
                    selectedTeamMember.u_id,
                    rating,
                    reviewText,
                    userId,
                    token
                );

                if (response.code === 200) {
                    Alert.alert('Success', 'Review submitted successfully!');
                    resetForm();
                    setModalVisibleReview(false);
                    setModalVisible(false);
                } else {
                    Alert.alert('Error', response.message);
                }
            } else {
                Alert.alert('Error', 'User data or token not found.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit review');
        }
    };
    const handleEmailClick = (email) => {
        const url = `mailto:${email}`;
        Linking.openURL(url).catch((err) => console.error('Failed to open email client:', err));
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
                    <Text style={styles.headerText}>Team Members</Text>
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

            <FlatList
                data={filteredTeamMembers}
                keyExtractor={(item) => item.u_id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <View style={styles.profileContainer}>
                            <Image
                                source={
                                    item?.u_pic
                                        ? { uri: `${BASE_URL}${item.u_pic}` }
                                        : require('../assets/images/icon.png')
                                }
                                style={styles.profilePic}
                            />
                            <View style={styles.nameContainer}>
                                <Text style={styles.name}>{item.u_name}</Text>
                                <Text style={styles.designation}>{item.u_designation}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleMemberPress(item)} style={{ position: 'absolute', top: '2%', right: '2%' }}><Feather name="more-horizontal" size={24} color="#32333E" /></TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={styles.rating}>{formatRating(item.rating.total_avg_rating)}</Text>
                            <Text style={{ fontSize: 14, color: '#42435E', }}>({item.rating.total_avg_rating})</Text>
                        </View>

                      

                            <View style={styles.contactInfoContainer}>

                                <View style={styles.contact}>
                                    <View>
                                        <Ionicons name="call-outline" size={16} color="#ffffff" />
                                    </View>

                                    <View>
                                        <Text style={styles.contactInfo}>+91 {`${item.u_mobile.slice(0, 3)}*****${item.u_mobile.slice(-2)}`}</Text>
                                    </View>

                                </View>

                                <View style={styles.email}>
                                    <View  style={styles.emailicon}>
                                        <Ionicons name="mail-outline" size={16} color="#ffffff"/>
                                    </View>
                                    <TouchableOpacity onPress={() => handleEmailClick(item.u_email)}>
                                        <Text style={styles.contactInfo}>
                                            {item.u_email.length > 30 ? item.u_email.substring(0, 28) + '...' : item.u_email}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                
                            </View>
                        </View>
                    
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#000000']}
                    />
                }
            />

            {selectedTeamMember && (
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ padding: '5%', marginTop: '10%' }}>
                                <View style={styles.modalHeader}>
                                    <LinearGradient
                                        colors={['#42435E', '#43ADCE']}
                                        style={styles.gradientHeader}
                                    >
                                        <View style={styles.checkContainer}>
                                            <Text style={styles.headerTextdesc}>Average Rating:
                                                <Text>{formatRating(selectedTeamMember.rating.total_avg_rating)}</Text>
                                                <Text>({selectedTeamMember.rating.total_avg_rating})</Text>
                                            </Text>
                                            <Text style={styles.headerTextdesc}>📞  +91 {`${selectedTeamMember.u_mobile.slice(0, 3)}*****${selectedTeamMember.u_mobile.slice(-2)}`}</Text>
                                            <Text style={styles.headerTextdesc}> ✉️ {selectedTeamMember.u_email.length > 30 ? selectedTeamMember.u_email.substring(0, 28) + '...' : selectedTeamMember.u_email}</Text>
                                        </View>
                                        <View style={styles.modalImageContainer}>
                                            <View style={styles.modalimagecontainer}>
                                                <Image
                                                    source={
                                                        selectedTeamMember?.u_pic
                                                            ? { uri: `${BASE_URL}${selectedTeamMember.u_pic}` }
                                                            : require('../assets/images/icon.png')
                                                    }
                                                    style={styles.modalprofilePic}
                                                />
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.postContainer} onPress={() => { setModalVisibleReview(true) }}>
                                <Text style={styles.postContainerText}>Rate the person</Text>
                            </TouchableOpacity>
                            <Text style={styles.namen}>{selectedTeamMember.u_name}</Text>
                            <View style={styles.modalDescription}>
                                <View>
                                    <Text style={styles.detail}>Date of Birth: {formatDate(selectedTeamMember.u_dob)}</Text>
                                    <Text style={styles.detail}>Joining Date: {formatDate(selectedTeamMember.u_doj)}</Text>
                                    <Text style={styles.detail}>Address: {selectedTeamMember.u_address}</Text>
                                    <Text style={styles.detail}>District: {selectedTeamMember.u_district}</Text>
                                    <Text style={styles.detail}>State: {selectedTeamMember.u_state}</Text>
                                    <Text style={styles.detail}>Pincode: {selectedTeamMember.u_pincode}</Text>
                                    <Text style={styles.detail}>Work Station: {selectedTeamMember.u_work_station}</Text>
                                </View>
                            </View>
                            <View style={styles.dismissButton}>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Text style={styles.dismissText}>Dismiss</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
            {selectedTeamMember && (
                <Modal
                    visible={modalVisibleReview}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setModalVisibleReview(false)}
                >

                    <View style={styles.addModalBackground}>
                        <LinearGradient
                            colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
                            style={styles.gradient}
                        />
                        <TouchableOpacity style={styles.backButton} onPress={() => setModalVisibleReview(false)}>
                            <Ionicons name="chevron-back" size={24} color="#32333E" />
                        </TouchableOpacity>
                        <View style={styles.formContainer}>
                            <Text style={styles.title}>Add Review & Rating</Text>

                            <View style={styles.UserName}>
                                <Text>{selectedTeamMember.u_name}</Text>
                            </View>
                            <View style={styles.stars}>
                                <Text style={styles.label}>Rate</Text>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => handleRatingChange(star)}
                                    >
                                        <Ionicons
                                            name={star <= rating ? "star" : "star-outline"}
                                            size={32}
                                            color={star <= rating ? "#FFD700" : "#D3D3D3"}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Write a Review"
                                value={reviewText}
                                onChangeText={setReviewText}
                                multiline
                                numberOfLines={4}
                            />
                            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                                <Text style={styles.submitButtonText}>Add Review</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </Modal>
            )}
        </View>
    );
};

export default TeamMembers;

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
      
        paddingTop:hp('2%'),
        paddingBottom:hp('1.8%'),
    },
    headerText: {
        fontSize: hp('2%'),
        color: '#32333E',
        fontWeight: 'bold',
        marginLeft: wp('2%'),
    },
    searchImage: {
        width: wp('5%'),
        height:hp('2%'),
    },
    searchIconContainer: {
        height:hp('5%'),
      
        width:wp('10%'),
        borderRadius:12,
        backgroundColor: '#FFFFFF33',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        marginHorizontal: 16,
        marginTop:hp('2%'),
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: wp('3%'),
        alignItems: 'center',
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal:wp('4%'),
        color: '#9DA1A5',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
   
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
    item: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 10,
        marginVertical: 8,
        marginHorizontal: 16,
        elevation: 5,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 10,
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 13,
        marginRight: '4%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        flex: 1,
    },
    name: {
        fontSize: wp('3.7%'),
        fontWeight: 'bold',
    },
    designation: {
        fontSize: wp('3%'),
        color: '#718096',
    },
    contactContainer: {
        flexDirection: 'column',
    },
    contactInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: hp('2%'),
    },
    contact: {
        backgroundColor: '#43ADCE',
        borderRadius: 9,
        padding: wp('2.2%'),
        flexDirection: 'row',
        justifyContent: 'space-between',
     
        alignItems: 'center',
    },
    contactInfo: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    emailInfo: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    email: {
        backgroundColor: '#42435E',
        borderRadius: 9,
        padding: wp('2.2%'),
        flexDirection: 'row',
        alignItems: 'center',
        width:wp('55%'),
    },
    emailicon: {
     
        marginRight:wp('2%'),
    },
    rating: {
        fontSize: 18,
        color: '#ECC94B',
        fontWeight: 'bold',
        paddingVertical: '1%',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: wp('85%'),
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    modalHeader: {
        height: hp('15%'),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    gradientHeader: {
        width: wp('80%'),
        height:hp('20%'),
        borderRadius: 10,
        paddingTop: '5%',
    },
    checkContainer: {
        width: wp('75%'),
        height: 90,
        backgroundColor: '#FFFFFF4D',
        borderRadius: 12,
        alignSelf: 'center',
        paddingLeft: '8%',
        paddingTop: '5%',
    },
    headerTextdesc: {
        fontSize: 12,
        fontWeight: '500',
        color: '#ffffff',
        lineHeight: 20,
    },
    modalImageContainer: {
        backgroundColor: '#fff',
        height: hp('9%'),
        width: hp('9%'),
        borderRadius: hp('4.5%'),
        position: 'absolute',
        left: '5%',
        top: '90%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalimagecontainer: {
        height: hp('9%'),
        width: hp('9%'),
        borderRadius: hp('4.5%'),
        backgroundColor: '#43ADCE33',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalprofilePic: {
        width: 60,
        height: 60,
        borderRadius: 100,
    },
    postContainer: {
        backgroundColor: '#43ADCE',
        borderRadius: 10,
        paddingVertical: '4%',
        width: '30%',
        alignSelf: 'flex-end',
        marginHorizontal: '5%',
        marginTop: '10%',
    },
    postContainerText: {
        fontSize: 10,
        lineHeight: 13,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    namen: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#292638',
        paddingLeft: '5%',
    },
    modalDescription: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        paddingLeft: '5%',
    },
    detail: {
        fontSize: 14,
        color: '#7C7A84',
        lineHeight: 29,
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
    addModalBackground: {
        flex: 1,
        backgroundColor: '#EBF0F4',
    },
    backButton: {
        paddingHorizontal: '2%',
        paddingVertical: '4%'
    },
    formContainer: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignSelf: 'center',
    },
    title: {
        fontSize: 24,
        color: '#222222',
        fontWeight: 'bold',
        marginBottom: 15,
    },
    UserName: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        padding: '5%',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    stars: {
        flexDirection: 'row',
        marginVertical: '10%',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: '#222222',
        marginHorizontal: '5%',
    },
    input: {
        fontSize: 16,
        color: '#222222',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: '5%',
        marginBottom: '5%',
        textAlignVertical: 'top',
        height: 100,
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
