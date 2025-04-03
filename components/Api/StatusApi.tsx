// Interface for the employee status data
export interface EmployeeStatusData {
    att_id: number;
    user_id: number;
    current_day: string;
    checkin_date: string;
    checkin_time: string;
    checkout_time: string;
    break_status: string;
    working_status: string;
    working_date: string;
    working_time: string;
}

// Interface for the status response
export interface StatusResponse {
    code: number;
    message: string;
    data?: EmployeeStatusData;
}

// API function to get employee status for today
export const getStatus = async (user_id: number, token: string): Promise<StatusResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token, 
            },
            body: JSON.stringify({
                action: "todayStatus",
                user_id: user_id
            }),
        });

        const data: StatusResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};

