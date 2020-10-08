import { getConnection, Repository } from "typeorm";
import { ProductDetail } from "../../database/entities/product-detail.entity";
import { ProductDetailDTO } from "./product-detail.dto";
import { ProductService } from "../product/product.service";

export class ProductDetailService {
    private productDetailRepository: Repository<ProductDetail>;
    private productService: ProductService;

    constructor() {
        this.productDetailRepository = getConnection().getRepository<ProductDetail>(ProductDetail);
        this.productService = new ProductService();
    }

    async findAll(): Promise<ProductDetail[]> {
        return await this.productDetailRepository.find({
            relations: ["product"]
        });
    }

    async findOne(id: string): Promise<ProductDetail|undefined> {
        return await this.productDetailRepository.findOne(id, {
            relations: ["product"]
        });
    }

    async store(body: ProductDetailDTO): Promise<ProductDetail|undefined> {
        const product = await this.productService.findOne(body.productId)
        if (product) {
            const productDetail = new ProductDetail();
            productDetail.product = product;
            productDetail.unit = body.unit;
            productDetail.qty = body.qty;
            productDetail.price = body.price;
            productDetail.storageType = body.storageType;
            const result = await this.productDetailRepository.save(productDetail);
            return result;
        }        
    }

    async update(body: ProductDetailDTO, id: string): Promise<ProductDetail | undefined> {
        const productDetail = await this.productDetailRepository.findOne(id);
        const product = await this.productService.findOne(body.productId);

        if (productDetail && product) {
            productDetail.product = product;
            productDetail.unit = body.unit;
            productDetail.qty = body.qty;
            productDetail.price = body.price;
            productDetail.storageType = body.storageType;
            const result = await this.productDetailRepository.save(productDetail);
            return result;
        }
    }

    async delete(id: string): Promise<true | undefined> {
        const productDetail = await this.productDetailRepository.findOne(id);
        
        if (productDetail) {
            this.productDetailRepository.remove(productDetail);
            return true;
        }

        return;
    }
}