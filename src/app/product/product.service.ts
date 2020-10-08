import { getConnection, Repository } from "typeorm";
import { Product } from "../../database/entities/product.entity";
import { ProductDTO, FindAllDTO } from "./product.dto";

export class ProductService {
    private productRepository: Repository<Product>;

    constructor() {
        this.productRepository = getConnection().getRepository<Product>(Product);
    }

    async findAll({code, name, isActive, size, page}: FindAllDTO): Promise<Product[]> {
        const take = size ? size : 10;
        const skip = page ? page : 1;
        const status = isActive ? isActive : 1;

        if (code && name) {
            return await this.productRepository.find({
                relations: ["productVariants"],
                where: {
                    code: code,
                    name: name,
                    isActive: status
                },
                take: take,
                skip: take * (skip - 1)
            });
        } else if (code) {
            return await this.productRepository.find({
                relations: ["productVariants"],
                where: {
                    code: code,
                    isActive: status
                },
                take: take,
                skip: take * (skip - 1)
            });
        } else if (name) {
            return await this.productRepository.find({
                relations: ["productVariants"],
                where: {
                    name: name,
                    isActive: status
                },
                take: take,
                skip: take * (skip - 1)
            });
        } else {
            return await this.productRepository.find({
                relations: ["productVariants"],
                where: {
                    isActive: status
                },
                take: take,
                skip: take * (skip - 1)
            });
        }
    }

    async findOne(id: string): Promise<Product|undefined> {
        return await this.productRepository.findOne(id, {
            where: {
                isActive: 1
            },
            relations: ["productVariants"]
        });
    }

    async store(body: ProductDTO): Promise<Product> {
        const product = new Product();
        product.code = body.code;
        product.name = body.name;
        product.isActive = body.isActive;
        const result = await this.productRepository.save(product);
        return result;
    }

    async update(body: ProductDTO, id: string): Promise<Product | undefined> {
        const product = await this.productRepository.findOne(id);
        
        if (product) {
            product.code = body.code;
            product.name = body.name;
            product.isActive = body.isActive;
            const result = await this.productRepository.save(product);
            return result;
        }
    }

    async delete(id: string): Promise<true | undefined> {
        const product = await this.productRepository.findOne(id);
        
        if (product) {
            product.isActive = 0;
            await this.productRepository.save(product);
            return true;
        }
    }
}