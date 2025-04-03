// Interface for the work report data
export interface WorkReportData {
    id: number;
    c_id: number;
    u_id: number;
    w_date: string;
    w_desc: string;
    status: number;
    created_at: string;
}

// Interface for the work report response
export interface WorkReportResponse {
    code: number;
    message: string;
    data?: WorkReportData[];
}

// API function to get work report list
export const getWorkReportList = async (user_id: number, token: string): Promise<WorkReportResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "workList",
                user_id: user_id
            }),
        });

        const data: WorkReportResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
// Interface for the add work report request data
export interface AddWorkReportRequest {
    action: string;
    company_id: number;
    user_id: number;
    work_date: string;
    work_desc: string;
}

// Interface for the add work report response
export interface AddWorkReportResponse {
    code: number;
    message: string;
    data?: string;
}

// API function to add a work report
export const addWorkReport = async (requestData: AddWorkReportRequest, token: string): Promise<AddWorkReportResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify(requestData),
        });

        const data: AddWorkReportResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong while adding the work report');
    }
};
