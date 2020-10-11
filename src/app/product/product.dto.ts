export interface FindAllDTO {
    code?: string;
    name?: string;
    size?: number;
    page?: number;
}

export interface StoreProductDTO {
    code: string;
    name: string;
}

export interface UpdateProductDTO {
    code: string;
    name: string;
}