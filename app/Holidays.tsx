import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity,  FlatList, TextInput, Modal, Image, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHolidayList, Holiday, HolidayListResponse } from '../components/Api/HolidaysApi';
import { router } from 'expo-router';
import Loader from './Loader';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const HolidayList = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchHolidays = async () => {
        try {
            setRefreshing(true); // Show refresh indicator
            const data = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');

            if (data && token) {
                const userId = JSON.parse(data).id;
                const companyId = JSON.parse(data).cid;
                const workStation = JSON.parse(data).work_station;

                const response: HolidayListResponse = await getHolidayList(userId, companyId, workStation, token);
                if (response.code === 200) {
                    setHolidays(response.data || []);
                } else {
                    setError(response.message);
                }
            } else {
                setError('User data or token not found.');
            }
        } catch (err) {
            setError('An error occurred while fetching the holiday list.');
        } finally {
            await sleep(800);
            setLoading(false);
            setRefreshing(false); // Hide refresh indicator
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const onRefresh = useCallback(() => {
        fetchHolidays();
    }, []);

    const filteredHolidays = holidays.filter(holiday =>
        holiday.h_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        holiday.h_date.includes(searchQuery) ||
        holiday.h_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        holiday.h_desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCardPress = (holiday: Holiday) => {
        setSelectedHoliday(holiday);
        setModalVisible(true);
    };

    const handleSearchPress = () => {
        setShowSearchBar(!showSearchBar);
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

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
                style={styles.gradient}
            />
            <View style={styles.header}>
                <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#32333E" />
                    <Text style={styles.headerText}>Holidays</Text>
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
                data={filteredHolidays}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleCardPress(item)} activeOpacity={1}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.h_name.length > 20 ? item.h_name.substring(0, 20) + '...' : item.h_name}</Text>
                                <Text style={styles.cardDate}>{item.h_date} ({new Date(item.h_date).toLocaleDateString('en-US', { weekday: 'long' })})</Text>
                            </View>
                            <View style={styles.cardFooter}>
                                <Text style={[styles.cardHolidayType, item.h_type === 'Restricted Holiday' ? styles.restricted : styles.holiday]}>
                                    {item.h_type}
                                </Text>
                                <View style={styles.cardView}>
                                    <Text style={styles.cardCount}>{item.h_leaves}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            />

            {selectedHoliday && (
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View>
                                <Text style={styles.namen}>{selectedHoliday.h_name}</Text>
                            </View>
                            <Text style={styles.detailText}>{selectedHoliday.h_desc}</Text>
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

export default HolidayList;

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
        paddingBottom: hp('2%'),
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
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 10,
        elevation: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardHeader: {
        flexDirection: 'column',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#32333E',
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 14,
        color: '#32333E',
    },
    cardFooter: {
        alignItems: 'flex-end',
    },
    cardHolidayType: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    restricted: {
        color: '#D9534F',
    },
    holiday: {
        color: '#5CB85C',
    },
    cardView: {
        height: 28,
        width: 28,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#42435E',
        elevation: 10,
        margin: 3,
    },
    cardCount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '75%',
        backgroundColor: '#FAFAFA',
        borderRadius: 15,
        paddingTop: '5%',
    },
    namen: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222222',
        marginVertical: '3%',
        marginHorizontal: '5%',
    },
    detailText: {
        fontSize: 16,
        color: '#22222299',
        marginHorizontal: '5%',
        marginVertical: '3%',
        lineHeight: 24,
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
