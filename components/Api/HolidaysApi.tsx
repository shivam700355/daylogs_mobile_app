// Interface for individual holiday data
export interface Holiday {
    id: number;
    c_id: number;
    h_name: string;
    h_date: string;
    h_leaves: number;
    h_desc: string;
    h_type: string;
    field: number;
    added_by: number;
    status: number;
    created_at: string;
  }
  
  // Interface for the holiday list response
  export interface HolidayListResponse {
    code: number;
    message: string;
    data: Holiday[];
  }
  
  // API function to get holiday list
  export const getHolidayList = async (
    user_id: number,
    company_id: number,
    work_station: string,
    token: string
  ): Promise<HolidayListResponse> => {
    try {
      const response = await fetch('https://localhost:8080/apis/root/employee.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          action: 'holidayList',
          user_id: user_id,
          company_id: company_id,
          work_station: work_station,
        }),
      });
  
      const data: HolidayListResponse = await response.json();
      return data;
    } catch (error) {
      console.error('API error:', error);
      throw new Error('Something went wrong');
    }
  };
  