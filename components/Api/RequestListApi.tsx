// Interface for the request data
export interface RequestData {
    id: number;
    c_id: number;
    u_id: number;
    r_date: string;
    r_title: string;
    r_desc: string;
    r_type: string;
    r_action: string;
    approve_by: number;
    status: number;
    added_by: number;
    created_at: string;
}

// Interface for the request response
export interface RequestResponse {
    code: number;
    message: string;
    data?: RequestData[];
}

// API function to get the request list
export const getRequestList = async (user_id: number, token: string): Promise<RequestResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "requestList",
                user_id: user_id,
            }),
        });

        const data: RequestResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};

// Define interfaces for adding request data and request type data
export interface AddRequestData {
    company_id: number;
    user_id: number;
    request_date: string;
    request_type: string;
    request_title: string;
    request_desc: string;
}

export interface AddRequestResponse {
    code: number;
    message: string;
    data?: string; // This holds the request ID
}

export interface RequestType {
    id: number;
    type: string;
    status: number;
    created_at: string;
}

export interface RequestTypeResponse {
    code: number;
    message: string;
    data?: RequestType[];
}

// API function to add a request
export const addRequest = async (
    requestData: AddRequestData,
    token: string
): Promise<AddRequestResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "addRequest",
                ...requestData,
            }),
        });

        const data: AddRequestResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};

// API function to get the request types
export const getRequestTypeList = async (
    user_id: number,
    token: string
): Promise<RequestTypeResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "requestTypeList",
                user_id: user_id,
            }),
        });

        const data: RequestTypeResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
