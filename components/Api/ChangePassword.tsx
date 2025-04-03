// Interface for the change password response
export interface ChangePasswordResponse {
    code: number;
    message: string;
    data?: any[];
}

// API function to change the user password
export const changePassword = async (user_id: number, old_password: string, new_password: string, token: string): Promise<ChangePasswordResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/common.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token, 
            },
            body: JSON.stringify({
                action: "changePassword",
                user_id: user_id,
                old_password: old_password,
                new_password: new_password
            }),
        });

        const data: ChangePasswordResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
