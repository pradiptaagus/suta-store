export interface FindAllProductDTO {
    code?: string;
    name?: string;
    storageType?: string|"store"|"warehouse";
    size?: number;
    page?: number;
}

export interface CountProductDto {
    code?: string;
    name?: string;
    storageType?: string|"store"|"warehouse";
}

export interface StoreProductDTO {
    code: string;
    name: string;
    storageType: string|"store"|"warehouse";
    qty: number;
}

export interface UpdateProductDTO {
    code: string;
    name: string;
    storageType: string|"store"|"warehouse";
    qty: number;
}