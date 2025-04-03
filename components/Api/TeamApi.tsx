// Interface for the rating data
export interface Rating {
    total_working_day: number;
    total_not_checkout_day: number;
    total_work_report: number;
    total_rating: string;
    checkout_percentage: string;
    work_percentage: string;
    rating_percentage: string;
    checkout_avg: string;
    work_avg: string;
    rating_avg: string;
    total_percentage: string;
    total_avg_rating: string;
}

// Updated interface for the team member data
export interface TeamMember {
    u_id: number;
    u_cid: number;
    u_name: string;
    u_mobile: string;
    u_email: string;
    u_password: string;
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
    u_salary: number;
    u_added_by: number;
    u_status: number;
    created_at: string;
    rating: Rating; // Add the rating field
}

// Updated interface for the team list response
export interface TeamListResponse {
    code: number;
    message: string;
    data?: TeamMember[];
}

// API function to get the team list
export const getTeamList = async (company_id: number, user_id: number, token: string): Promise<TeamListResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "teamList",
                company_id: company_id,
                user_id: user_id
            }),
        });

        const data: TeamListResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
