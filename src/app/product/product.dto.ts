export interface ProductDTO {
    code: string;
    name: string;
    isActive: number;
}

export interface FindAllDTO {
    code?: string;
    name?: string;
    isActive?: number;
    size?: number;
    page?: number;
}