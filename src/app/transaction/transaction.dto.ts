export interface FindAllTransactionDTO {
    size: number;
    page: number;
    startDate?: string;
    endDate?:string;
}

export interface CountTransactionDTO {
    startDate?: string;
    endDate?:string;
}

export interface StoreTransactionDTO {
    date: string;
    note: string;
    discount: number;
    transactionTotal: number;
    paymentAmount: number;
}

export interface UpdateTransctionDTO {
    date: string;
    note: string;
    discount: number;
    transactionTotal: number;
    paymentAmount: number;
}