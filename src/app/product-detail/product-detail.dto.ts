export interface FindAllProductDetailDto {
    size?: number;
    page?: number;
    productName?: string;
}

export interface CountProductDetailDto {
    productName?: string;
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