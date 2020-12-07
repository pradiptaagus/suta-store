import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
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

    @ManyToOne(() => Product, product => product.productVariant)
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
    createdAt!: string;

    @UpdateDateColumn()
    updatedAt!: string;

    @DeleteDateColumn()
    deletedAt!: string;

    @OneToMany(() => ProductSnapshot, productSnapshot => productSnapshot.productVariant)
    productSnapshot!: ProductSnapshot;
}