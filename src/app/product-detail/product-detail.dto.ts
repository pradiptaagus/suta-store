export interface FindAllProductDetailDto {
    size?: number;
    page?: number;
    search?: string;
}

export interface CountProductDetailDto {
    search?: string;
}

export interface StoreProductDetailDTO {
    productId: string;
    unit: string;
    qty: number;
    price: number;
    storageType: string;
}

export interface UpdateProductDetailDTO {
    productId: string;
    unit: string;
    qty: number;
    price: number;
    storageType: string;
}