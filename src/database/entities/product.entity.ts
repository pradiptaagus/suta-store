import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { ProductDetail } from "./product-detail.entity";

export enum storageType {
    STORE = "store",
    WAREHOUSE = "warehouse"
}

@Entity({name: "products"})
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "varchar", length: 50, nullable: true})
    code!: string;

    @Column({type: "varchar", length: 100, nullable: true})
    name!: string;

    @Column({type: "enum", enum: storageType, default: storageType.STORE, nullable: true})
    storageType!: string;

    @Column({type: "int", nullable: true, default: 0}) // TODO: remove this. unused
    qty!: number;

    @Column({type: "int", nullable: false, default: 0})
    qtyStore!: number;

    @Column({type: "int", nullable: false, default: 0})
    qtyWarehouse!: number;

    @CreateDateColumn()
    createdAt!: string;
    
    @UpdateDateColumn()
    updatedAt!: string;

    @DeleteDateColumn()
    deletedAt!: string;

    @OneToMany(() => ProductDetail, productDetail => productDetail.product)
    productVariant!: ProductDetail[];
}