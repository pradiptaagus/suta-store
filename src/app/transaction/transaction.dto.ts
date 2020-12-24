export interface FindAllTransactionDTO {
    size: number;
    page: number;
    startDate?: string;
    endDate?:string;
    note?: string;
}

export interface CountTransactionDTO {
    startDate?: string;
    endDate?:string;
    note?: string;
}

export interface StoreTransactionDTO {
    date: string;
    note: string;
    discount: number;
    transactionTotal: number;
    paymentAmount: number;
}

export interface UpdateTransactionDTO {
    date: string;
    note: string;
    discount: number;
    transactionTotal: number;
    paymentAmount: number;
}

export interface ReportTransactionDTO {
    startDate: string;
    endDate: string;
}