import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Image, Text, TextInput, TouchableOpacity,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkUserApi } from '@/components/Api/LoginApi';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const OtpPage: React.FC = ({ navigation }: any) => {
  const [contact, setContact] = useState("");
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContactChange = (contact: string) => {
    const sanitizedContact = contact.replace(/[^0-9]/g, ''); // Allow only numeric characters
    if (sanitizedContact.length <= 10) {
      setContact(sanitizedContact);
      setErrorMessage(''); // Clear error message when the input is valid
    }
  };

  const handleLogin = async () => {
    if (contact.length === 0) {
      setErrorMessage('Enter the number');
    } else if (contact.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
    } else {
      setLoading(true);
      try {
        // Check if the user is registered
        const response = await checkUserApi(contact);

        if (response.code === 200 && response.data === contact) {
          // User is registered, proceed to OTP verification
          await AsyncStorage.setItem('contact', contact);
          router.replace('/VerifyOtp');
        } else {
          // User is not registered, show an error message
          setErrorMessage('The phone number is not registered.');
        }
      } catch (error) {
        console.error('Failed to check user:', error);
        setErrorMessage('The phone number is not registered.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
        style={styles.gradient}
      />
      <View style={styles.containerOne}>
        <View>
          <Text style={styles.textOne}>Welcome Back!</Text>
          <Text style={styles.textTwo}>Let's login to Daylogs!</Text>
        </View>
        <View>
          <Image
            source={require('../assets/images/one.png')}
            style={styles.img}
          />
        </View>
      </View>
      <View>
        <View style={styles.card}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={24} color="#43ADCE" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter contact number"
              keyboardType="phone-pad"
              value={contact}
              onChangeText={handleContactChange}
              maxLength={10}
              accessibilityLabel="Phone number input"
            />
          </View>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <TouchableOpacity onPress={handleLogin} disabled={loading} accessibilityLabel="Send OTP button">
            <Text style={styles.sendOtpText}>
              {loading ? 'Sending the OTP...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.containerLast}>
        <TouchableOpacity style={[styles.button, styles.logInbtn]} accessibilityLabel="Log in button">
          <Text style={styles.inText}>Log in</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>-----------------or-----------------</Text>
        <TouchableOpacity
          style={[styles.button, styles.logInbtn]}
          onPress={() => {
            router.replace('/');
          }}
          accessibilityLabel="Log in via Password button"
        >
          <Text style={styles.inText}>Log in via Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OtpPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#EBF0F4',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 240,
  },
  containerOne: {
    flexDirection: 'row',
    marginTop: 40,
    paddingTop: 20,
  },
  textOne: {
    marginTop: 30,
    marginLeft: 10,
    fontSize: 28,
    fontWeight: 'bold',
  },
  textTwo: {
    fontSize: 14,
    marginLeft: 10,
    color: '#737C8C',
  },
  img: {
    marginTop: 20,
  },
  card: {
    backgroundColor: '#F6F8FA',
    width: '90%',
    alignSelf: 'center',
    height: 250,
    padding: 10,
    borderRadius: 20,
    shadowColor: '#474747',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#7A849C',
    margin: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E4E9',
    borderWidth: 1,
    borderRadius: 40,
    margin: 8,
    padding: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
  },
  sendOtpText: {
    color: '#43AECF',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  containerLast: {
    alignItems: 'center',
    marginTop: 30,
  },
  button: {
    width: '90%',
    padding: 15,
    alignItems: 'center',
    borderRadius: 30,
  },
  logInbtn: {
    backgroundColor: '#C3C8CB',
  },
  inText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    marginVertical: 10,
    color: '#969AA8',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginLeft: 20,
  },
});
