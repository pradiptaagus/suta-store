import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { TransactionDetail } from "./transaction-detail.entity";

@Entity({name: "transactions"})
export class Transaction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "text"})
    note!: string;

    @Column({type: "date"})
    date!: string;

    @CreateDateColumn()
    createdAt!: Timestamp;

    @UpdateDateColumn()
    updatedAt!: Timestamp;

    @OneToMany(type => TransactionDetail, transactionDetail => transactionDetail.transaction)
    transactionDetails!: TransactionDetail;
}