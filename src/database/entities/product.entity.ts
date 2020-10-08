import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { ProductDetail } from "./product-detail.entity";
import { ProductSnapshot } from "./product-snapshot.entity";

@Entity({name: "products"})
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "varchar", length: 50})
    code!: string;

    @Column({type: "varchar", length: 100})
    name!: string;

    @Column({type: "smallint"})
    isActive!: number;

    @CreateDateColumn()
    createdAt!: Timestamp;
    
    @UpdateDateColumn()
    updatedAt!: Timestamp;

    @OneToMany(type => ProductDetail, productDetail => productDetail.product)
    productVariants!: ProductDetail;
}