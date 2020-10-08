export interface ProductSnapshotDTO {
    productVariantId: string;
    code: string;
    name: string;
    unit: string;
    qty: number;
    price: number;
    discount: number;
    totalPrice: number;
}

export interface StoreProductSnapshotDTO extends ProductSnapshotDTO {}

export interface UpdateProductSnapshotDTO extends ProductSnapshotDTO {}