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
    note?: string;
}

export interface UpdateTransctionDTO {
    date: string;
    note?: string;
}