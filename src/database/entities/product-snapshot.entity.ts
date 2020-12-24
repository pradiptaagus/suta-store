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

    @Column({type: "varchar", length: 50, nullable: true})
    code!: string;

    @Column({type: "varchar", length: 100, nullable: true})
    name!: string;

    @Column({type: "varchar", length: 20, nullable: true})
    unit!: string;

    @Column({type: "int", nullable: true})
    qty!: number;

    @Column({type: "int", nullable: true})
    price!: number;

    @Column({type: "int", nullable: true})
    discount!: number;

    @Column({type: "int", nullable: true})
    totalPrice!: number;

    @Column({type: "int", nullable: true})
    subTotal!: number;

    @CreateDateColumn()
    createdAt!: Timestamp;

    @UpdateDateColumn()
    updatedAt!: Timestamp;
}