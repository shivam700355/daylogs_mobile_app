// Interfaces for the attendance data
export interface AttendanceData {
    id: number;
    c_id: number;
    u_id: number;
    checkin_date: string;
    checkin_time: string;
    checkout_time: string;
    break: number;
    h_index: number;
    logged_by: number;
    status: number;
    created_at: string;
}

// Interface for the current month's attendance response
export interface CurrentMonthAttendanceResponse {
    code: number;
    message: string;
    data?: AttendanceData[];
}

// Interface for the attendance report response
export interface ReportResponse {
    code: number;
    message: string;
    data?: AttendanceData[];
}

// API function to get the current month's attendance data
export const getCurrentMonthAttendance = async (
    user_id: number,
    token: string
): Promise<CurrentMonthAttendanceResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "currentMonthAttendance",
                user_id: user_id,
            }),
        });

        const data: CurrentMonthAttendanceResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong while fetching the current month attendance data');
    }
};

// API function to get the attendance report for a specified date range
export const getAttendanceReport = async (
    user_id: number,
    start_date: string,
    end_date: string,
    token: string
): Promise<ReportResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "attendanceReport",
                user_id: user_id,
                start_date: start_date,
                end_date: end_date,
            }),
        });

        const data: ReportResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong while fetching the attendance report');
    }
};

// Interface for individual attendance log data
export interface AttendanceLog {
    id: number;
    att_id: number;
    log_type: string;
    log_time: string;
    log_location: string;
    log_lat_long: string;
    status: number;
    created_at: string;
    updated_at: string;
}

// Interface for attendance log response
export interface AttendanceLogResponse {
    code: number;
    message: string;
    data?: AttendanceLog[];
}
// API function to get the attendance log data
export const getAttendanceLog = async (
    user_id: number,
    attendance_id: number,
    token: string
): Promise<AttendanceLogResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "attendanceLog",
                user_id: user_id,
                attendance_id: attendance_id,
            }),
        });

        const data: AttendanceLogResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong while fetching the attendance log data');
    }
};
