// Interface for adding a review response
export interface AddReviewResponse {
  code: number;
  message: string;
  data?: string; // Assuming data is the review ID when a review is added
}

// Interface for posted review data
export interface PostedReviewData {
  id: number;
  c_id: number;
  u_id: number;
  rating: number;
  review: string;
  added_by: number;
  status: number;
  created_at: string;
  u_name: string;
}

// Interface for the posted review list response
export interface PostedReviewListResponse {
  code: number;
  message: string;
  data: PostedReviewData[];
}
export const addReview = async (
  company_id: number,
  ru_id: number,
  ru_rating: number,
  ru_remark: string,
  added_by: number,
  token: string
): Promise<AddReviewResponse> => {
  try {
    const response = await fetch('https://localhost:8080/apis/root/employee.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        action: "addReview",
        company_id,
        ru_id,
        ru_rating,
        ru_remark,
        added_by,
      }),
    });

    const data: AddReviewResponse = await response.json();
    return data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Something went wrong while adding the review');
  }
};
export const getPostedReviewList = async (user_id: number, token: string): Promise<PostedReviewListResponse> => {
  try {
    const response = await fetch('https://localhost:8080/apis/root/employee.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        action: "postedReviewList",
        user_id
      }),
    });

    const data: PostedReviewListResponse = await response.json();
    return data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Something went wrong while fetching the posted review list');
  }
};
