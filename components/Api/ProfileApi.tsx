// Interface for the user profile data
export interface UserProfileData {
    u_id: number;
    u_cid: number;
    u_name: string;
    u_mobile: string;
    u_email: string;
    u_address: string;
    u_district: string;
    u_state: string;
    u_pincode: string;
    u_pic: string;
    u_role: string;
    u_designation: string;
    u_dob: string;
    u_doj: string;
    u_work_station: string;
    u_dor: string;
    u_salary: number;
    u_added_by: number;
    u_status: number;
    created_at: string;
}

// Interface for the user profile response
export interface UserProfileResponse {
    code: number;
    message: string;
    data?: UserProfileData;
}

// API function to get the user profile
export const getUserProfile = async (user_id: number, token: string): Promise<UserProfileResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/common.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "userProfile",
                user_id: user_id,
            }),
        });

        const data: UserProfileResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
// Interface for the logout response
export interface LogoutResponse {
    code: number;
    message: string;
    data: boolean;
}
// API function to log out the user
export const logoutUser = async (
    user_id: number,
    token: string
): Promise<LogoutResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/common.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: 'logout',
                user_id: user_id,
                token: token,
            }),
        });

        const data: LogoutResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Logout failed');
    }
};

export const updateProfilePic = async (userId: number, token: string, base64Image: string) => {
    try {
        const response = await fetch(`https://localhost:8080/apis/root/common.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({
                action: 'addProfilePic',
                user_id: userId,
                profile_file: base64Image,
            }),
        });

        const result = await response.json();
        console.log('Update Profile Picture Response:', result); // Debugging line
        return result;
    } catch (error) {
        console.error('Error updating profile picture:', error);
        throw new Error('Failed to update profile picture.');
    }
};

