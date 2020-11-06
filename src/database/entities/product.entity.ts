import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { ProductDetail } from "./product-detail.entity";

@Entity({name: "products"})
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "varchar", length: 50})
    code!: string;

    @Column({type: "varchar", length: 100})
    name!: string;

    @CreateDateColumn()
    createdAt!: Timestamp;
    
    @UpdateDateColumn()
    updatedAt!: Timestamp;

    @DeleteDateColumn()
    deletedAt!: string;

    @OneToMany(type => ProductDetail, productDetail => productDetail.product)
    productVariant!: ProductDetail;
}