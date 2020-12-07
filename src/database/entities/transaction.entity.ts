import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { ProductSnapshot } from "./product-snapshot.entity";

@Entity({name: "transactions"})
export class Transaction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "text", nullable: true})
    note!: string;

    @Column({type: "date"})
    date!: string;

    @Column({type: "int", nullable: true})
    transactionTotal!: number;

    @CreateDateColumn()
    createdAt!: Timestamp;

    @UpdateDateColumn()
    updatedAt!: Timestamp;

    @DeleteDateColumn()
    deletedAt!: Timestamp;

    @OneToMany(() => ProductSnapshot, productSnapshot => productSnapshot.transaction)
    productSnapshot!: ProductSnapshot;
}