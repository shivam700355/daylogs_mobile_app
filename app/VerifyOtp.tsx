import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Image, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { otpLoginApi } from '../components/Api/LoginApi';
import Toast from 'react-native-toast-message';

const VerifyOtp: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [contact, setContact] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const inputs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
    if (!value && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const getContact = async () => {
      try {
        const number = await AsyncStorage.getItem('contact');
        if (number) {
          setContact(number);
        }
      } catch (error) {
        console.error('Failed to get contact:', error);
        setErrorMessage('Failed to retrieve contact number. Please try again.');
      }
    };
    getContact();
  }, []);

  const handleLogin = async () => {
    if (otp.some(digit => digit === '')) {
      setErrorMessage('Enter the 4-digit OTP');
      setTimeout(() => {
        setErrorMessage('');
      }, 1000);
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      const data = await otpLoginApi(contact, otp.join(''));
      await AsyncStorage.setItem('userData', JSON.stringify(data.data));
      await AsyncStorage.setItem('userToken', data.data.token);
      if (data.code === 200 && data.data) {
        console.log('API response:', data);
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'You have successfully logged in!',
          position: 'top',
          visibilityTime: 1000,
        });
        setTimeout(() => {
          router.replace('/Dashboard');
        }, 600);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      setErrorMessage('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
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
          <Text style={styles.firstText}>OTP Verification</Text>
          <Text style={styles.secondText}>We've just sent you a 4-digit code to your phone number</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={el => (inputs.current[index] = el)}
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={value => handleOtpChange(value, index)}
                onKeyPress={e => handleKeyPress(e, index)}
              />
            ))}
          </View>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
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
        
        <Text style={styles.orText}>-----------------or-----------------</Text>
        <TouchableOpacity style={[styles.button, styles.backbtn]} onPress={() => router.replace('/')}>
          <Text style={styles.inText}>Log in via Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VerifyOtp;

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
  firstText: {
    marginTop: 20,
    fontSize: 20,
    alignSelf: 'center',
    fontWeight: 'bold',
    color: '#02050F',
  },
  secondText: {
    alignSelf: 'center',
    color: '#4C4E55',
    fontSize: 14,
    marginTop: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#C3C8CB',
    borderRadius: 50,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: '#fff',
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
    backgroundColor: '#43ADCE',
  },
  backbtn: {
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
    marginTop: 10,
  },
});
