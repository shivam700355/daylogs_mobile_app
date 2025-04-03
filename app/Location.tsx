import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, View, Alert, Text } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
export default function HomeScreen() {
    const [location, setLocation] = useState<any>(null);
    const [reverseGeocodedAddress, setReverseGeocodedAddress] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
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
        getPermissions();
    }, []);

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
                const address = reverseGeocodedAddresses[0];
                const formattedAddress = ` ${address.formattedAddress}`;

                setReverseGeocodedAddress(formattedAddress);

                router.push({
                    pathname: '/Check',
                    params: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        address: formattedAddress || "Unknown Location",
                    },
                });
            } else {
                Alert.alert("Error", "No address found for the current location.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to reverse geocode.");
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <Button title="Reverse Geocode Current Location" onPress={reverseGeocode} />
            {location && (
                <>
                    <Text>Latitude: {location.coords.latitude}</Text>
                    <Text>Longitude: {location.coords.longitude}</Text>
                </>
            )}
            {reverseGeocodedAddress && <Text>Address: {reverseGeocodedAddress}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
});
