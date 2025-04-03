import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity,FlatList, RefreshControl, Modal, ScrollView, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { getAnnouncementList, AnnouncementData, AnnouncementResponse } from '../components/Api/AnnouncementApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from './Loader';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const Announcement = () => {
    const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementData | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');

            if (data && token) {
                const userId = JSON.parse(data).id;
                const companyId = JSON.parse(data).cid;
                const response: AnnouncementResponse = await getAnnouncementList(companyId, userId, token);
                if (response.code === 200) {
                    setAnnouncements(response.data || []);
                } else {
                    setError(response.message);
                }
            } else {
                setError('User data or token not found.');
            }
        } catch (err) {
            setError('An error occurred while fetching the announcement list.');
        } finally {
            await sleep(800);
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAnnouncements();
        setRefreshing(false);
    };

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

    const handleCardPress = (announcement: AnnouncementData) => {
        setSelectedAnnouncement(announcement);
        setModalVisible(true);
    };

    const handleSearchPress = () => {
        setShowSearchBar(!showSearchBar);
    };

    const filteredAnnouncements = announcements.filter(announcement =>
        announcement.a_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.a_desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.a_date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.created_at.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
                style={styles.gradient}
            />
            <View style={styles.header}>
                <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#32333E" />
                    <Text style={styles.headerText}>Announcements</Text>
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
                    data={filteredAnnouncements}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => {
                        const { formattedDate, formattedTime } = formatCreatedAt(item.created_at);

                        return (
                            <TouchableOpacity onPress={() => handleCardPress(item)} activeOpacity={1} >
                                <View style={styles.item}>
                                    <Text style={styles.date}>{formatDate(item.a_date)}</Text>
                                    <Text style={styles.title}>{item.a_title}</Text>
                                    <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">{item.a_desc}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <View style={styles.indexContainer}>
                                            <Text style={styles.indexText}>Announced On</Text>
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
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#000000']}
                        />
                    }
                />
            </View>

            {selectedAnnouncement && (
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>{selectedAnnouncement.a_title}</Text>
                            <Text style={styles.modalDate}>{formatDate(selectedAnnouncement.a_date)}</Text>
                            <View style={styles.modalScrollContainer}>
                                <ScrollView>
                                    <Text style={styles.modalDescription}>{selectedAnnouncement.a_desc}</Text>
                                </ScrollView>
                            </View>
                            <TouchableOpacity style={styles.dismissButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.dismissText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default Announcement;

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
        paddingBottom:  hp('1%'),
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
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#32333E',
        marginTop: 8,
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
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        width: '85%',
    },
    modalTitle: {
        fontSize:wp('5%'),
        fontWeight: 'bold',
        color: '#222222',
        marginVertical: '3%',
        marginHorizontal: '5%',
    },
    modalDate: {
        fontSize: 16,
        color: '#222222',
        marginHorizontal: '5%',
        marginVertical: '3%',
        lineHeight: 24,
    },
    modalDescription: {
        fontSize:wp('4%'),
        color: '#22222299',
        marginHorizontal: '5%',
        marginVertical: '3%',
        lineHeight: 20,
        textAlign: 'justify',
    },
    modalScrollContainer: {
        maxHeight: 500,
    },
    dismissButton: {
        borderRadius: 10,
        backgroundColor: '#43ADCE33',
        width: '100%',
        paddingVertical: '3%'
    },
    dismissText: {
        textAlign: 'center',
        fontSize:wp('4%'),
        lineHeight: 29,
        fontWeight: 'bold',
        color: '#2D3748',
    },
});
