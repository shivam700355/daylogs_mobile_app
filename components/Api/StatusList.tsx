// Interface for individual status entry
export interface StatusEntry {
    id: number;
    c_id: number;
    u_id: number;
    s_msg: string;
    s_date: string;
    s_time: string;
    break_status: number;
    status: number;
    created_at: string;
}

// Interface for the status list response
export interface StatusListResponse {
    code: number;
    message: string;
    data: StatusEntry[];
}

// API function to get status list
export const getStatusList = async (user_id: number, token: string): Promise<StatusListResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "statusList",
                user_id: user_id,
            }),
        });

        const data: StatusListResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};

// Interface for the working status update response
export interface WorkingStatusResponse {
    code: number;
    message: string;
    data: boolean;
}

// API function to update working status
export const addWorkingStatus = async (
    company_id: number,
    user_id: number,
    working_status: string,
    break_status: string,
    token: string
): Promise<WorkingStatusResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "addWorkingStatus",
                company_id: company_id,
                user_id: user_id,
                working_status: working_status,
                break: break_status,
            }),
        });

        const data: WorkingStatusResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
