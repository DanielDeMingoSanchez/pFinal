import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterCredentials, Document, Category } from '../types';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (credentials: LoginCredentials) => 
        api.post<AuthResponse>('/auth/login', credentials),
    
    register: (credentials: RegisterCredentials) => 
        api.post<AuthResponse>('/auth/register', credentials)
};

export const documentsApi = {
    uploadDocument: (formData: FormData) => 
        api.post<Document>('/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }),
    
    getDocumentsByCategory: (category: Category, page: number = 0, size: number = 10) => 
        api.get<{ content: Document[] }>(`/documents/category/${category}`, {
            params: { page, size }
        }),
    
    getUserDocuments: (page: number = 0, size: number = 10) => 
        api.get<{ content: Document[] }>('/documents/user', {
            params: { page, size }
        })
};

export default api; 