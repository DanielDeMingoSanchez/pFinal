export enum Category {
    COLEGIO = 'COLEGIO',
    INSTITUTO = 'INSTITUTO',
    UNIVERSIDAD = 'UNIVERSIDAD',
    FORMACION_PROFESIONAL = 'FORMACION_PROFESIONAL',
    CURSOS_ONLINE = 'CURSOS_ONLINE',
    MASTER = 'MASTER',
    DOCTORADO = 'DOCTORADO',
    OTROS = 'OTROS'
}

export interface User {
    id: number;
    email: string;
    name: string;
}

export interface Document {
    id: number;
    name: string;
    fileUrl: string;
    fileSize: number;
    category: Category;
    uploadedAt: string;
    updatedAt: string;
    description?: string;
    uploadedBy: User;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    name: string;
} 