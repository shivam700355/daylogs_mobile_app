// Interface for individual review data
export interface Review {
    id: number;
    c_id: number;
    u_id: number;
    rating: number;
    review: string;
    added_by: number;
    status: number;
    created_at: string;
    posted_by: string;
}

// Interface for the review list response
export interface ReviewListResponse {
    code: number;
    message: string;
    data: Review[];
}

// API function to get review list
export const getReviewList = async (
    user_id: number,
    token: string
): Promise<ReviewListResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: 'reviewList',
                user_id: user_id,
            }),
        });

        const data: ReviewListResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
