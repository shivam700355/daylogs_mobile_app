import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const Loader = () => {
    return (
        <View style={styles.container}>
            <LottieView
                source={require('../assets/LoaderN.json')}
                autoPlay
                loop
                style={styles.loader}
            />
        </View>
    );
};

export default Loader;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    loader: {
        width: 250,
        height: 250,
        backgroundColor: 'transparent',
    },
});
