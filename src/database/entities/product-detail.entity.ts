import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { ProductSnapshot } from "./product-snapshot.entity";
import { Product } from "./product.entity";

@Entity({name: "product_details"})
export class ProductDetail {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Product, product => product.productVariant)
    product!: Product;

    @Column({type: "varchar", length: 20, nullable: true})
    unit!: string;

    @Column({type: "int", nullable: true})
    qtyPerUnit!: number;

    @Column({type: "int", nullable: true})
    price!: number;

    @Column({type: "boolean", nullable: true})
    isParent!: boolean;

    @OneToOne(() => ProductDetail)
    @JoinColumn({name: "childId"})
    childId!: ProductDetail|null;

    @CreateDateColumn()
    createdAt!: string;

    @UpdateDateColumn()
    updatedAt!: string;

    @DeleteDateColumn()
    deletedAt!: string;

    @OneToMany(() => ProductSnapshot, productSnapshot => productSnapshot.productVariant)
    productSnapshot!: ProductSnapshot;
}