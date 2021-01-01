import { getConnection, IsNull, Like, Not, Repository } from "typeorm";
import { Product } from "../../database/entities/product.entity";
import { StoreProductDTO, UpdateProductDTO, FindAllProductDTO, CountProductDto } from "./product.dto";

export class ProductService {
    private productRepository: Repository<Product>;

    constructor() {
        this.productRepository = getConnection().getRepository<Product>(Product);
    }

    async totalRecord(query: CountProductDto) {
        const code = query.code;
        const name = query.name;
        const storageType = query.storageType;

        const whereClause: object[] = [];
        if (code) whereClause.push({code: Like(`%${code}%`)});
        if (name) whereClause.push({name: Like(`%${name}%`)});
        if (storageType) whereClause.push({storageType: Like(`%${storageType}%`)});

        return await this.productRepository.count({
            join: {
                alias: "product",
                leftJoin: {
                    productVariant: "product.productVariant",
                    child: "productVariant.child"
                }
            },
            where: whereClause
        });
    }

    async findAll(query: FindAllProductDTO): Promise<Product[]> {
        const take = query.size ? query.size : 10;
        const skip = query.page ? (query.page - 1) * take : 0;
        const code = query.code;
        const name = query.name;
        const storageType = query.storageType;

        const whereClause: object[] = [];
        if (code) whereClause.push({code: Like(`%${code}%`)});
        if (name) whereClause.push({name: Like(`%${name}%`)});
        if (storageType) whereClause.push({storageType: Like(`%${storageType}%`)});

        return await this.productRepository.find({
            join: {
                alias: "product",
                leftJoinAndSelect: {
                    productVariant: "product.productVariant",
                    child: "productVariant.child"
                }
            },
            where: whereClause,
            take: take,
            skip: skip,
            order: {
                createdAt: "ASC"
            }
        });
    }

    async findOne(id: string): Promise<Product | undefined> {
        return await this.productRepository.findOne(id, {
            join: {
                alias: "product",
                leftJoinAndSelect: {
                    productVariant: "product.productVariant",
                    child: "productVariant.child"
                }
            }
        });
    }

    async store(body: StoreProductDTO): Promise<Product> {
        const product = new Product();
        product.code = body.code;
        product.name = body.name;
        product.storageType = body.storageType;
        product.qty = body.qty;
        const result = await this.productRepository.save(product);
        return result;
    }

    async update(body: UpdateProductDTO, id: string): Promise<Product | undefined> {
        const product = await this.productRepository.findOne(id);

        if (product) {
            product.code = body.code;
            product.name = body.name;
            product.storageType = body.storageType;
            product.qty = body.qty;
            const result = await this.productRepository.save(product);
            return result;
        }
    }

    async updateStock(additionQty: number, id: string): Promise<Product | undefined> {
        const product = await this.productRepository.findOne(id);
        if (product) {
            product.qty = additionQty
            const result = await this.productRepository.save(product);
            return result;
        }
    }

    async delete(id: string): Promise<true | undefined> {
        const product = await this.productRepository.findOne(id);

        if (product) {
            await this.productRepository.softDelete(id);
            return true;
        }
    }
}