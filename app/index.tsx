import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Image, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loginApi } from '../components/Api/LoginApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const Index = () => {
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleContactChange = (contact: string) => {
    const numericContact = contact.replace(/[^0-9]/g, '');
    if (numericContact.length <= 10) {
      setContact(numericContact);
      if (numericContact.length === 10) {
        setErrorMessage('');
      }
    } else {
      setErrorMessage("Only 10 digit phone numbers are allowed");
      setTimeout(() => {
        setErrorMessage('');
      }, 1000);
    }
  };

  const handlePasswordChange = (password: string) => {
    setPassword(password);
    if (password !== '') {
      setErrorMessage('');
    }
  };

  const handleLogin = async () => {
    if (contact.length === 0 && password === '') {
      setErrorMessage('All fields are required');
    } else if (contact.length !== 10) {
      setErrorMessage('Enter a 10 digit contact number');
    } else if (password === '') {
      setErrorMessage('Enter password');
    } else if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters');
      return;
    } else {
      setErrorMessage('');
      try {
        const data = await loginApi(contact, password);
        setIsLoading(true);
        if (data.code === 200 && data.data) {
          await AsyncStorage.setItem('userData', JSON.stringify(data.data));
          await AsyncStorage.setItem('userToken', data.data.token);
          console.log('API response:', data);
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'You have successfully logged in!',
            position: 'top',
            visibilityTime: 1000, 
          });
          setIsLoading(false);
          setTimeout(() => {
            router.replace('/Dashboard');
          }, 600);
        } else {
          setErrorMessage(data.message || 'Invalid credentials');
          setIsLoading(false);
        }
      } catch (error: any) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(118, 187, 208, 1)', 'rgba(118, 187, 208, 0)']}
        style={styles.gradient}
      />
      <Toast />
      <View style={styles.containerOne}>
        <View>
          <Text style={styles.textOne}>Welcome Back !</Text>
          <Text style={styles.textTwo}>Let's login to Daylogs !</Text>
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
              placeholder="Enter contact Number"
              keyboardType="phone-pad"
              value={contact}
              onChangeText={handleContactChange}
            />
          </View>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#43ADCE" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter Password"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={handlePasswordChange}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons name={passwordVisible ? "eye-outline" : "eye-off-outline"} size={24} color="#43ADCE" style={styles.icon} />
            </TouchableOpacity>
          </View>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <TouchableOpacity onPress={() => {
            Linking.openURL('https://localhost:8080/login');
          }}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.containerLast}>
        <TouchableOpacity style={[styles.button, styles.logInbtn]} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.inText}>Continue</Text>
          )}
        </TouchableOpacity>
        {/* <AwesomeAlert
          show={showAlert}
          title='Verified!!'
          titleStyle={{ fontSize: 20, color: '#292825' }}
          message='Hurrah!! You have successfully Verified the account'
          messageStyle={{ fontSize: 14, color: '#292825' }}
          showConfirmButton={true}
          confirmText='✓'
          confirmButtonTextStyle={{ color: '#76BBD0', fontSize: 50 }}
          confirmButtonColor='#76BBD033'
          confirmButtonStyle={{ alignItems: 'center', justifyContent: 'center', height: 100, width: 100, borderRadius: 50, }}
        /> */}
        <Text style={styles.orText}>-----------------or-----------------</Text>
        <TouchableOpacity style={[styles.button, styles.otpbtn]}
          onPress={() => {
            router.replace('/OtpPage');
          }}
        >
          <Text style={styles.inText}>Log in via OTP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Index;

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
  forgotPassword: {
    alignSelf: 'flex-end',
    color: '#43AECF',
    marginTop: 5,
    textDecorationLine: 'underline',
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
    backgroundColor: '#43ADCE'
  },
  otpbtn: {
    backgroundColor: '#C3C8CB'
  },
  inText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    color: '#7A849C',
    marginVertical: 10,
  },
  error: {
    color: '#FF5C5C',
    marginVertical: 5,
  },
});

