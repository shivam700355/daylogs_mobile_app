import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Animated, Dimensions, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReviewList, Review } from '../components/Api/MyReviewApi';
import { PostedReviewData, PostedReviewListResponse, getPostedReviewList } from '../components/Api/PostReviewApi';
import Loader from './Loader';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const { width } = Dimensions.get('window');

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
    const [filteredPostReviews, setFilteredPostReviews] = useState<PostedReviewData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
    const [currentTab, setCurrentTab] = useState<'myReviews' | 'postReviews'>('myReviews');
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const animation = useRef(new Animated.Value(0)).current;
    const scrollView = useRef(null);

    const fetchReviews = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userData = await AsyncStorage.getItem('userData');
            const userId = userData ? JSON.parse(userData).id : null;

            if (userId && token) {
                const response = await getReviewList(userId, token);
                if (response.code === 200) {
                    setReviews(response.data || []);
                    setFilteredReviews(response.data || []);
                } else {
                    setError(response.message);
                }
            } else {
                setError('User data or token not found.');
            }
        } catch (error) {
            setError('An error occurred while fetching the reviews.');
        } finally {
            await sleep(800);
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPostReviews = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');
            if (data && token) {
                const userId = JSON.parse(data).id;
                const response: PostedReviewListResponse = await getPostedReviewList(userId, token);
                if (response.code === 200) {
                    setFilteredPostReviews(response.data || []);
                } else {
                    setError(response.message);
                }
            } else {
                setError('User data or token not found.');
            }
        } catch (error) {
            setError('Failed to fetch reviews');
        } finally {
            await sleep(800);
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
        fetchPostReviews();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReviews();
        fetchPostReviews();
    }, []);

    const handleSearchPress = (tab: 'myReviews' | 'postReviews') => {
        setCurrentTab(tab);
        setShowSearchBar(!showSearchBar);
    };
    const searchReviews = (text: string) => {
        setSearchQuery(text);

        if (currentTab === 'myReviews') {
            const filtered = reviews.filter((review) =>
                review.posted_by.toLowerCase().includes(text.toLowerCase()) ||
                review.rating.toString().includes(text.toLowerCase()) ||
                review.created_at.toLowerCase().includes(text.toLowerCase()) ||
                review.review.toLowerCase().includes(text.toLowerCase()) ||
                review.u_id.toString().includes(text.toLowerCase()) ||
                review.c_id.toString().includes(text.toLowerCase()) ||
                review.added_by.toString().includes(text.toLowerCase()) ||
                review.id.toString().includes(text.toLowerCase()) ||
                review.status.toString().includes(text.toLowerCase())
            );
            setFilteredReviews(filtered);
        } else if (currentTab === 'postReviews') {
            const filtered = filteredPostReviews.filter((review) =>
                review.u_name.toLowerCase().includes(text.toLowerCase()) ||
                review.rating.toString().includes(text.toLowerCase()) ||
                review.created_at.toLowerCase().includes(text.toLowerCase()) ||
                review.review.toLowerCase().includes(text.toLowerCase()) ||
                review.u_id.toString().includes(text.toLowerCase()) ||
                review.c_id.toString().includes(text.toLowerCase()) ||
                review.added_by.toString().includes(text.toLowerCase()) ||
                review.id.toString().includes(text.toLowerCase())
            );
            setFilteredPostReviews(filtered);
        }
    };

    const renderReviewItem = ({ item }: { item: PostedReviewData }) => (
        <View style={styles.reviewCard}>
            <Text style={styles.reviewText}>Review: {item.review}</Text>
            <Text style={styles.ratingText}>
                Rating:{Array.from({ length: 5 }, (_, i) => (
                    <AntDesign
                        key={i}
                        name={i < item.rating ? "star" : "staro"}
                        size={14}
                        color="#FFA500"
                    />
                ))}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={styles.indexContainer}>
                    <Text style={styles.indexText}>To: {item.u_name}</Text>
                </View>
                <View style={styles.createdAtContainer}>
                    <Text style={styles.createdAtDate}><AntDesign name="calendar" size={12} color="white" />  {formatDate(item.created_at)}</Text>
                </View>
            </View>
        </View>
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}/${date.getFullYear()}`;
    };

    if (loading && !refreshing) {
        return <Loader />;
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const myReviewsTabPress = () => {
        scrollView.current.scrollTo({ x: 0 });
        setCurrentTab('myReviews');
    };

    const postReviewsTabPress = () => {
        scrollView.current.scrollTo({ x: width });
        setCurrentTab('postReviews');
    };

    const myReviewsColorInterpolate = animation.interpolate({
        inputRange: [0, width],
        outputRange: ['rgba(67, 173, 206, 1)', 'rgba(118, 187, 208, 0.4)'],
    });
    const postReviewColorInterpolate = animation.interpolate({
        inputRange: [0, width],
        outputRange: ['rgba(118, 187, 208, 0.4)', 'rgba(67, 173, 206, 1)'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
                style={styles.gradient}
            />
            <View style={styles.header}>
                <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#2D3748" />
                    <Text style={styles.headerText}>Reviews & Rating</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.searchIconContainer} onPress={() => handleSearchPress(currentTab)}>
                    <Image source={require('../assets/images/search-normal.png')} style={styles.searchImage} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                <Animated.View style={[styles.tabOne, { backgroundColor: myReviewsColorInterpolate }]}>
                    <Text style={styles.tabText} onPress={myReviewsTabPress}>My Reviews</Text>
                </Animated.View>
                <Animated.View style={[styles.tabTwo, { backgroundColor: postReviewColorInterpolate }]}>
                    <Text style={styles.tabText} onPress={postReviewsTabPress}>Posted Review</Text>
                </Animated.View>
            </View>
            <View style={styles.searchContainerH}>
                {showSearchBar && (
                    <View style={styles.searchContainer}>
                        <Image source={require('../assets/images/search.png')} style={styles.searchImage} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search"
                            value={searchQuery}
                            onChangeText={searchReviews}
                        />
                    </View>
                )}
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
                {/* My Reviews Section */}
                <View style={styles.contentContainer}>
                    <FlatList
                        data={filteredReviews}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.reviewCard}>
                                <Text style={styles.reviewText}>Review: {item.review}</Text>
                                <View style={styles.ratingContainer}>
                                    <Text style={styles.ratingText}>Rating: </Text>
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <AntDesign
                                            key={i}
                                            name={i < item.rating ? "star" : "staro"}
                                            size={14}
                                            color="#FFA500"
                                        />
                                    ))}
                                </View>
                                <View style={styles.reviewFooter}>
                                    <View style={styles.indexContainer}>
                                        <Text style={styles.indexText}>By: {item.posted_by}</Text>
                                    </View>
                                    <View style={styles.createdAtContainer}>
                                        <Text style={styles.createdAtDate}><AntDesign name="calendar" size={12} color="white" /> {formatDate(item.created_at)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                </View>

                {/* Post Review Section */}
                <View style={styles.contentContainer}>
                    <FlatList
                        data={filteredPostReviews}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderReviewItem}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                </View>
            </ScrollView>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: '4%',
        paddingTop:hp('3%'),
        paddingBottom: '2%',
    },
    headerText: {
        fontSize: 18,
        color: '#2D3748',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    searchImage: {
        width: 20,
        height: 20,
    },
    searchIconContainer: {
        height: 40,
        width: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF33',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainerH: {
        backgroundColor: '#FAFAFA',
        paddingVertical: '1%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    searchContainer: {
        marginHorizontal: 16,
        marginTop: 10,
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 10,
        color: '#9DA1A5',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 40,
    },
    tabContainer: {
        flexDirection: 'row',
        marginVertical: '2%',
        paddingHorizontal: '4%',
        alignSelf: 'center',
        borderRadius: 10,
    },
    tabOne: {
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    tabTwo: {
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    tabText: {
        color: '#fff',
        fontSize: 18,
        paddingVertical: '3%',
        paddingHorizontal: '8%',
    },
    contentContainer: {
        width,
        paddingHorizontal: '1%',
        backgroundColor: '#FAFAFA',

    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        marginVertical: 8,
        padding: 16,
        borderRadius: 16,
        elevation: 4,
    },
    reviewText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#32333E',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    reviewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    indexContainer: {
        alignSelf: 'center',
        backgroundColor: '#76BBD033',
        borderRadius: 8,
        padding: 8,
    },
    indexText: {
        fontSize: 12,
        color: '#42435E',
    },
    createdAtContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginLeft: 'auto',
        padding: '2%',
        borderRadius: 8,
    },
    createdAtDate: {
        fontSize: 12,
        color: '#FFFFFF',
        backgroundColor: '#43ADCE',
        padding: '2%',
        borderRadius: 9,
        textAlign: 'center',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#E53E3E',
    },
});
