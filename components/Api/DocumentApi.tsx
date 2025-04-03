// Interface for adding document data
export interface AddDocumentData {
    company_id: number;
    user_id: number;
    document_type: string;
    document_number: string;
    added_by: number;
    document_file: string;
}

// Interface for the response when adding a document
export interface AddDocumentResponse {
    code: number;
    message: string;
    data?: string; // This holds the document ID
}

// API function to add a document
export const addDocument = async (
    documentData: AddDocumentData,
    token: string
): Promise<AddDocumentResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/common.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "addDocument",
                ...documentData,
            }),
        });

        const data: AddDocumentResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};

// Interface for document type data
export interface DocumentType {
    id: number;
    name: string;
    status: number;
    created_at: string;
}

// Interface for the response when fetching document types
export interface DocumentTypeResponse {
    code: number;
    message: string;
    data?: DocumentType[];
}

// API function to get the document types
export const getDocumentTypeList = async (
    user_id: number,
    token: string
): Promise<DocumentTypeResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/common.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "documentType",
                user_id: user_id,
            }),
        });

        const data: DocumentTypeResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};


// Interface for document data
export interface DocumentData {
    id: number;
    c_id: number;
    u_id: number;
    doc_type: string;
    doc_number: string;
    doc_file: string;
    added_by: number;
    status: number;
    created_at: string;
}

// Interface for the response when fetching the document list
export interface DocumentListResponse {
    code: number;
    message: string;
    data?: DocumentData[];
}
// API function to get the document list
export const getDocumentList = async (
    user_id: number,
    token: string
): Promise<DocumentListResponse> => {
    try {
        const response = await fetch('https://localhost:8080/apis/root/employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                action: "documentList",
                user_id: user_id,
            }),
        });

        const data: DocumentListResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API error:', error);
        throw new Error('Something went wrong');
    }
};
