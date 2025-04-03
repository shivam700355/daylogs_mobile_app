// Interface for the check-in request data
export interface CheckinRequest {
    action: string;
    user_id: number;
    company_id: number;
    address: string;
    lat_long: string;
}

// Interface for the check-in response
export interface CheckinResponse {
    code: number;
    message: string;
    data?: any[]; // Assuming the data is an empty array; update if necessary
}

// API function to handle employee check-in
export const checkinApi = async (requestData: CheckinRequest, token: string): Promise<CheckinResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify(requestData),
        });

        const data: CheckinResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong during check-in');
    }
};

// Interface for the checkout request data
export interface CheckoutRequest {
    action: string;
    user_id: number;
    company_id: number;
    attendance_id: number;
    address: string;
    lat_long: string;
    h_index: number;
}

// Interface for the checkout response
export interface CheckoutResponse {
    code: number;
    message: string;
    data?: any[]; // Assuming the data is an empty array; update if necessary
}

// API function to handle employee checkout
export const checkoutApi = async (requestData: CheckoutRequest, token: string): Promise<CheckoutResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify(requestData),
        });

        const data: CheckoutResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong during checkout');
    }
};
