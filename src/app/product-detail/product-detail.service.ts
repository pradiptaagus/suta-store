import { getConnection, Like, Repository } from "typeorm";
import { ProductDetail } from "../../database/entities/product-detail.entity";
import { CountProductDetailDto, FindAllProductDetailDto, StoreProductDetailDTO, UpdateProductDetailDTO } from "./product-detail.dto";
import { ProductService } from "../product/product.service";

export class ProductDetailService {
    private productDetailRepository: Repository<ProductDetail>;
    private productService: ProductService;

    constructor() {
        this.productDetailRepository = getConnection().getRepository<ProductDetail>(ProductDetail);
        this.productService = new ProductService();
    }

    async totalRecord(query: CountProductDetailDto) {
        const productName = query.productName;

        let whereClause: string = `"product"."deletedAt" is null`;
        if (productName) whereClause = `"product"."name" like '%${productName}%' and "product"."deletedAt" is null`;

        return await this.productDetailRepository.count({
            join: {
                alias: "productDetail",
                leftJoin: {
                    product: "productDetail.product"
                }
            },
            where: whereClause
        });
    }

    async findAll(query: FindAllProductDetailDto): Promise<ProductDetail[]> {
        const take = query.size ? query.size : 10;
        const skip = query.page ? (query.page - 1) * take : 0;
        const productName = query.productName;

        let whereClause: string = `"product"."deletedAt" is null`;
        if (productName) whereClause = `"product"."name" like '%${productName}%' and "product"."deletedAt" is null`;

        return await this.productDetailRepository.find({
            join: {
                alias: "productDetail",
                leftJoinAndSelect: {
                    product: "productDetail.product"
                }
            },
            where: whereClause,
            take: take,
            skip: skip
        });
    }

    async findOne(id: string): Promise<ProductDetail|undefined> {
        return await this.productDetailRepository.findOne(id, {
            join: {
                alias: "productDetail",
                leftJoinAndSelect: {
                    product: "productDetail.product"
                }
            }
        });
    }

    async store(body: StoreProductDetailDTO): Promise<ProductDetail|undefined> {
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

    async update(body: UpdateProductDetailDTO, id: string): Promise<ProductDetail | undefined> {
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

    async updateStock(qty: number, id: string) {
        const productDetail = await this.productDetailRepository.findOne(id);
        if (productDetail) {
            productDetail.qty = qty;
            const result = await this.productDetailRepository.save(productDetail);
            return result;
        }
    }

    async delete(id: string): Promise<true | undefined> {
        const productDetail = await this.productDetailRepository.findOne(id);
        
        if (productDetail) {
            await this.productDetailRepository.softDelete(id);
            return true;
        }
    }
}