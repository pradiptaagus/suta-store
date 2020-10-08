import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { ProductDetail } from "./product-detail.entity";
import { TransactionDetail } from "./transaction-detail.entity";

@Entity({name: "product_snapshots"})
export class ProductSnapshot {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(type => ProductDetail, productDetail => productDetail.productSnapshot)
    productVariant!: ProductDetail;

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

    @CreateDateColumn()
    createdAt!: Timestamp;

    @UpdateDateColumn()
    updatedAt!: Timestamp;

    @OneToMany(type => TransactionDetail, transactionDetail => transactionDetail.productSnapshot)
    transactionDetail!: TransactionDetail;
}