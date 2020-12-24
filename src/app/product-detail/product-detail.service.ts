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
        const search = query.search;

        let whereClause: string[] = [`"product"."deletedAt" is null`];
        if (search) whereClause.push(`"product"."name" like '%${search}%' or "product"."code" like '%${search}%'`);

        return await this.productDetailRepository.count({
            join: {
                alias: "productDetail",
                leftJoin: {
                    product: "productDetail.product",
                    child: "productDetail.childId"
                }
            },
            where: whereClause.join(" and ")
        });
    }

    async findAll(query: FindAllProductDetailDto): Promise<ProductDetail[]> {
        const take = query.size ? query.size : 10;
        const skip = query.page ? (query.page - 1) * take : 0;
        const search = query.search;

        let whereClause: string[] = [`"product"."deletedAt" is null`];
        if (search) whereClause.push(`"product"."name" like '%${search}%' or "product"."code" like '%${search}%'`);
        
        return await this.productDetailRepository.find({
            join: {
                alias: "productDetail",
                leftJoinAndSelect: {
                    product: "productDetail.product",
                    child: "productDetail.childId"
                }
            },
            where: whereClause.join(" and "),
            take: take,
            skip: skip
        });
    }

    async findOne(id: string): Promise<ProductDetail|undefined> {
        return await this.productDetailRepository.findOne(id, {
            join: {
                alias: "productDetail",
                leftJoinAndSelect: {
                    product: "productDetail.product",
                    child: "productDetail.childId"
                }
            }
        });
    }

    async store(body: StoreProductDetailDTO): Promise<ProductDetail|undefined> {
        const product = await this.productService.findOne(body.productId)
        const child = body.childId ? await this.productDetailRepository.findOne(body.childId) : null;
        if (product) {
            const productDetail = new ProductDetail();
            productDetail.product = product;
            productDetail.unit = body.unit;
            productDetail.qtyPerUnit = body.qtyPerUnit;
            productDetail.price = body.price;
            productDetail.isParent = body.isParent ? true : false;
            if (child) productDetail.childId = child;
            const result = await this.productDetailRepository.save(productDetail);
            return result;
        }        
    }

    async update(body: UpdateProductDetailDTO, id: string): Promise<ProductDetail | undefined> {
        const productDetail = await this.productDetailRepository.findOne(id);
        const product = await this.productService.findOne(body.productId);
        const child = body.childId ? await this.productDetailRepository.findOne(body.childId) : null;
        if (productDetail && product) {
            productDetail.product = product;
            productDetail.unit = body.unit;
            productDetail.qtyPerUnit = body.qtyPerUnit;
            productDetail.price = body.price;
            productDetail.isParent = +body.isParent ? true : false;
            productDetail.childId = child ? child : null;
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