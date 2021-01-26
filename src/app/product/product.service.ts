import { getConnection, IsNull, Like, Not, Repository } from "typeorm";
import { Product } from "../../database/entities/product.entity";
import { StoreProductDTO, UpdateProductDTO, FindAllProductDTO, CountProductDto } from "./product.dto";
import { ProductDetail } from "../../database/entities/product-detail.entity";

export class ProductService {
    private productRepository: Repository<Product>;

    constructor() {
        this.productRepository = getConnection().getRepository<Product>(Product);
    }

    sortProductVariant(productVariants: ProductDetail[]) {
        return productVariants.sort((a, b) => b.price - a.price);
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

    async isExists(code: string): Promise<boolean> {
        const products = await this.productRepository.find({
            where: {
                code: code
            }
        });
        return products.length > 0;
    }

    async isExistsExcept(code: string, id: string): Promise<boolean> {
        const products = await this.productRepository.find({
            where: {
                code: code,
                id: Not(id)
            }
        });
        return products.length > 0;
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

        const products = await this.productRepository.find({
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
        
        if (products) {
            products.map(product => {
                this.sortProductVariant(product.productVariant);
            })
        }
        return products;
    }

    async findOne(id: string): Promise<Product | undefined> {
        const product = await this.productRepository.findOne(id, {
            join: {
                alias: "product",
                leftJoinAndSelect: {
                    productVariant: "product.productVariant",
                    child: "productVariant.child"
                }
            }
        });
        if(product) {
            product.productVariant = this.sortProductVariant(product.productVariant);
        }
        return product;
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