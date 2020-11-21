import { getConnection, Repository } from "typeorm";
import { ProductSnapshot } from "../../database/entities/product-snapshot.entity";
import { ProductDetailService } from "../product-detail/product-detail.service";
import { StoreProductSnapshotDTO, UpdateProductSnapshotDTO } from "./product-snapshot.dto";

export class ProductSnapshotService {
    private productSnapshotRepository: Repository<ProductSnapshot>;
    private productVariantService: ProductDetailService;

    constructor() {
        this.productSnapshotRepository = getConnection().getRepository<ProductSnapshot>(ProductSnapshot);
        this.productVariantService = new ProductDetailService();
    }

    async findAll(): Promise<ProductSnapshot[]> {
        return await this.productSnapshotRepository.find();
    }

    async findOne(id: string): Promise<ProductSnapshot|undefined> {
        return await this.productSnapshotRepository.findOne(id);
    }

    async store(body: StoreProductSnapshotDTO): Promise<ProductSnapshot|undefined> {
        const productVariant = await this.productVariantService.findOne(body.productVariantId);
        if (productVariant) {
            const productSnapshot = new ProductSnapshot();
            productSnapshot.productVariant = productVariant;
            productSnapshot.code = body.code;
            productSnapshot.name = body.name;
            productSnapshot.unit = body.unit;
            productSnapshot.qty = body.qty;
            productSnapshot.price = body.price;
            productSnapshot.discount = body.discount;
            productSnapshot.totalPrice = body.totalPrice;
            productSnapshot.subTotal = body.subTotal;
            const result = await this.productSnapshotRepository.save(productSnapshot);
            return result;
        }
    }

    async update(body: UpdateProductSnapshotDTO, id: string): Promise<ProductSnapshot|undefined> {
        const productSnapshot = await this.productSnapshotRepository.findOne(id);
        const productVariant = await this.productVariantService.findOne(body.productVariantId);

        if (productVariant && productSnapshot) {
            productSnapshot.productVariant = productVariant;
            productSnapshot.code = body.code;
            productSnapshot.name = body.name;
            productSnapshot.unit = body.unit;
            productSnapshot.qty = body.qty;
            productSnapshot.price = body.price;
            productSnapshot.discount = body.discount;
            productSnapshot.totalPrice = body.totalPrice;
            productSnapshot.subTotal = body.subTotal;
            const result = await this.productSnapshotRepository.save(productSnapshot);
            return result;
        }
    }

    async delete(id: string): Promise<true|undefined> {
        const productSnapshot = await this.productSnapshotRepository.findOne(id);
        
        if (productSnapshot) {
            this.productSnapshotRepository.remove(productSnapshot);
            return true;
        }
    }
}