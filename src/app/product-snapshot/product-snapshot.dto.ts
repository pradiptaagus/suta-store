export interface ProductSnapshotDTO {
    productVariantId: string;
    transactionId: string;
    code: string;
    name: string;
    unit: string;
    qty: number;
    price: number;
    discount: number;
    totalPrice: number;
    subTotal: number;
}

export interface StoreProductSnapshotDTO extends ProductSnapshotDTO {}

export interface UpdateProductSnapshotDTO extends ProductSnapshotDTO {}