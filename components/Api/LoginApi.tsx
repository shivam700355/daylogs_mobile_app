import AsyncStorage from '@react-native-async-storage/async-storage';

// Interfaces for user data and login response
export interface UserData {
  id: number;
  name: string;
  mobile: string;
  role: string;
  pic: string;
  work_station?: string;
  cid: number;
  cname?: string;
  cpic?: string;
  token: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data?: UserData;
}

// API function for password login
export const loginApi = async (mobile: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch('https://localhost:8080/apis/root/common.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: "passwordLogin",
        mobile,
        password,
      }),
    });

    const data: LoginResponse = await response.json();

    if (data.code === 200 && data.data?.token) {
      // Store the token in AsyncStorage
      await AsyncStorage.setItem('userToken', data.data.token);
    }

    return data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Something went wrong');
  }
};

// Interface for checkUser response
export interface CheckUserResponse {
  code: number;
  message: string;
  data?: string;  // Assuming 'data' is the mobile number as per your example
}

// API function for checking user by mobile number
export const checkUserApi = async (mobile: string): Promise<CheckUserResponse> => {
  try {
    const response = await fetch('https://localhost:8080/apis/root/common.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: "checkUser",
        mobile,
      }),
    });

    const data: CheckUserResponse = await response.json();

    if (data.code === 200 && data.data) {
      // Optionally, you can store the mobile number or other details if needed
      await AsyncStorage.setItem('checkedUserMobile', data.data);
    }

    return data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Something went wrong');
  }
};
// API function for OTP login using the same structure
export const otpLoginApi = async (mobile: string, otp: string): Promise<LoginResponse> => {
  try {
    const response = await fetch('https://localhost:8080/apis/root/common.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: "otpLogin",
        mobile,
        otp,
      }),
    });

    const data: LoginResponse = await response.json();

    if (data.code === 200 && data.data?.token) {
      // Store the token in AsyncStorage
      await AsyncStorage.setItem('userToken', data.data.token);
    }

    return data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Something went wrong');
  }
};

// Interface for individual user session data
export interface UserSession {
  id: number;
  c_id: number;
  u_id: number;
  device: string;
  session: string;
  created_at: string;
}

// Interface for the user session response
export interface UserSessionResponse {
  code: number;
  message: string;
  data: UserSession;
}

// API function to get user session data
export const getUserSession = async (
  user_id: number,
  token: string
): Promise<UserSessionResponse> => {
  try {  
    const response = await fetch('https://localhost:8080/apis/root/common.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        action: 'userSession',
        user_id: user_id,
      }),
    });

    const data: UserSessionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Something went wrong');
  }
};
