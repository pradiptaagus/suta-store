import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { ProductDetail } from "./product-detail.entity";
import { Transaction } from "./transaction.entity";

@Entity({name: "product_snapshots"})
export class ProductSnapshot {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => ProductDetail, productDetail => productDetail.productSnapshot)
    productVariant!: ProductDetail;

    @ManyToOne(() => Transaction, transaction => transaction.productSnapshot)
    transaction!: Transaction;

    @Column({type: "varchar", length: 50})
    code!: string;

    @Column({type: "varchar", length: 100})
    name!: string;

    @Column({type: "varchar", length: 20})
    unit!: string;

    @Column({type: "int"})
    qty!: number;

    @Column({type: "int"})
    price!: number;

    @Column({type: "int"})
    discount!: number;

    @Column({type: "int"})
    totalPrice!: number;

    @Column({type: "int", nullable: true})
    subTotal!: number;

    @CreateDateColumn()
    createdAt!: Timestamp;

    @UpdateDateColumn()
    updatedAt!: Timestamp;
}