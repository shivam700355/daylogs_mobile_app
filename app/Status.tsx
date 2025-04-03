import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { getStatusList, StatusEntry, StatusListResponse } from '../components/Api/StatusList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from './Loader';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const StatusListPage = () => {
    const [statusList, setStatusList] = useState<StatusEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchStatusList = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');

            if (data && token) {
                const userId = JSON.parse(data).id;
                const response: StatusListResponse = await getStatusList(userId, token);
                if (response.code === 200) {
                    setStatusList(response.data || []);
                } else {
                    setError(response.message);
                }
            } else {
                setError('User data or token not found.');
            }
        } catch (err) {
            setError('An error occurred while fetching the status list.');
        } finally {
            await sleep(800);
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStatusList();
    }, []);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStatusList();
    }, []);

    const formatDateTime = (dateString: string, timeString: string) => {
        const date = new Date(dateString);

        // Format the date as dd/mm/yyyy
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        const formattedDateWithoutDay = `${day}/${month}/${year}`;

        // Format the time
        const timeParts = timeString.split(':');
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        // Format the date with the weekday (if needed)
        const dateOptionsWithDay: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit', weekday: 'long' };
        const formattedDateWithDay = date.toLocaleDateString('en-GB', dateOptionsWithDay);

        return { formattedDateWithDay, formattedDateWithoutDay, formattedTime };
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
                    <Text style={styles.headerText}>Status List</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.displayContainer}>
                <FlatList
                    data={statusList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => {
                        const { formattedDateWithDay, formattedDateWithoutDay, formattedTime } = formatDateTime(item.s_date, item.s_time);

                        return (
                            <View style={styles.item}>
                                <Text style={styles.date}>{formattedDateWithDay}</Text>
                                <Text style={styles.statusMessage}>{item.s_msg.trim()}</Text>
                                <View style={styles.dateTimeContainer}>
                                    <View style={styles.createdAt}>
                                        <Text style={styles.createdAtText}>Added On </Text>
                                    </View>
                                    <View style={styles.createdAtContainer}>
                                        <View style={styles.dateContainer}>
                                            <Text style={styles.dateText}><AntDesign name="calendar" size={12} color="white" /> {formattedDateWithoutDay}</Text>
                                        </View>
                                        <View style={styles.timeContainer}>
                                            <Text style={styles.timeText}><Ionicons name="time-outline" size={12} color="white" /> {formattedTime}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                        />
                    }
                />
            </View>
            <TouchableOpacity style={styles.fab} onPress={() => { router.push('/Check') }}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default StatusListPage;

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
        marginVertical: 10,
        padding: '4%',
        borderRadius: 20,
        elevation: 4,
    },
    date: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#32333E',
        marginBottom: '1%',
    },
    statusMessage: {
        fontSize: 14,
        color: '#6C757D',
        marginBottom: '1%',
    },
    createdAt: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#76BBD033',
        borderRadius: 8,
        flexDirection: 'row',
    },
    createdAtContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    createdAtText: {
        fontSize: 12,
        color: '#42435E',
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    dateContainer: {
        backgroundColor: '#43ADCE',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginRight: 16,
    },
    dateText: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    timeContainer: {
        backgroundColor: '#42435E',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    timeText: {
        color: '#FFFFFF',
        fontSize: 12,
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
});
