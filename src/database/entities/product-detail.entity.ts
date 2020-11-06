import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { ProductSnapshot } from "./product-snapshot.entity";
import { Product } from "./product.entity";

export enum storageType {
    STORE = "store",
    WAREHOUSE = "warehouse"
}

@Entity({name: "product_details"})
export class ProductDetail {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(type => Product, product => product.productVariant)
    product!: Product;

    @Column({type: "varchar", length: 20})
    unit!: string;

    @Column({type: "int"})
    qty!: number;

    @Column({type: "int"})
    price!: number;

    @Column({type: "enum", enum: storageType, default: storageType.STORE})
    storageType!: string; 

    @CreateDateColumn()
    createdAt!: Timestamp;

    @UpdateDateColumn()
    updatedAt!: Timestamp;

    @OneToMany(type => ProductSnapshot, productSnapshot => productSnapshot.productVariant)
    productSnapshot!: ProductSnapshot;
}