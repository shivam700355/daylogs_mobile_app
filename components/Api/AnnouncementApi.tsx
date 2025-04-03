// Interface for the announcement data
export interface AnnouncementData {
    id: number;
    c_id: number;
    a_date: string;
    a_title: string;
    a_desc: string;
    added_by: number;
    status: number;
    created_at: string;
}

// Interface for the announcement response
export interface AnnouncementResponse {
    code: number;
    message: string;
    data?: AnnouncementData[];
}

// API function to get the announcement list
export const getAnnouncementList = async (company_id: number, user_id: number, token: string): Promise<AnnouncementResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "announcementList",
                company_id: company_id,
                user_id: user_id,
            }),
        });

        const data: AnnouncementResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
