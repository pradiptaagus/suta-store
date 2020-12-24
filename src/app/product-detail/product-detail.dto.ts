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
    qtyPerUnit: number;
    price: number;
    isParent: boolean;
    childId?: string;
}

export interface UpdateProductDetailDTO {
    productId: string;
    unit: string;
    qtyPerUnit: number;
    price: number;
    isParent: boolean;
    childId?: string;
}