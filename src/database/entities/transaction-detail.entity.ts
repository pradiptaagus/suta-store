import { CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { ProductSnapshot } from "./product-snapshot.entity";
import { Transaction } from "./transaction.entity";

@Entity({name: "transaction_details"})
export class TransactionDetail {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(type => Transaction, transaction => transaction.transactionDetail)
    transaction!: Transaction;

    @ManyToOne(type => ProductSnapshot, productSnaphot => productSnaphot.transactionDetail)
    productSnapshot!: ProductSnapshot;

    @CreateDateColumn()
    createdAt!: Timestamp;
    
    @UpdateDateColumn()
    updatedAt!: Timestamp;
}