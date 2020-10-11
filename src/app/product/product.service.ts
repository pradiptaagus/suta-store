import { getConnection, Repository } from "typeorm";
import { Product } from "../../database/entities/product.entity";
import { StoreProductDTO, UpdateProductDTO, FindAllDTO } from "./product.dto";
import { DateGenerator } from "../../helpers/date-generator.helper";

export class ProductService {
    private productRepository: Repository<Product>;

    constructor() {
        this.productRepository = getConnection().getRepository<Product>(Product);
    }

    async findAll({code, name, size, page}: FindAllDTO): Promise<Product[]> {
        const take = size ? size : 10;
        const skip = page ? page : 1;

        if (code && name) {
            return await this.productRepository.find({
                relations: ["productVariants"],
                where: {
                    code: code,
                    name: name
                },
                take: take,
                skip: take * (skip - 1)
            });
        } else if (code) {
            return await this.productRepository.find({
                relations: ["productVariants"],
                where: {
                    code: code
                },
                take: take,
                skip: take * (skip - 1)
            });
        } else if (name) {
            return await this.productRepository.find({
                relations: ["productVariants"],
                where: {
                    name: name
                },
                take: take,
                skip: take * (skip - 1)
            });
        } else {
            return await this.productRepository.find({
                relations: ["productVariants"],
                take: take,
                skip: take * (skip - 1)
            });
        }
    }

    async findOne(id: string): Promise<Product|undefined> {
        return await this.productRepository.findOne(id, {
            relations: ["productVariants"]
        });
    }

    async store(body: StoreProductDTO): Promise<Product> {
        const product = new Product();
        product.code = body.code;
        product.name = body.name;
        const result = await this.productRepository.save(product);
        return result;
    }

    async update(body: UpdateProductDTO, id: string): Promise<Product | undefined> {
        const product = await this.productRepository.findOne(id);
        
        if (product) {
            product.code = body.code;
            product.name = body.name;
            const result = await this.productRepository.save(product);
            return result;
        }
    }

    async delete(id: string): Promise<true | undefined> {
        const product = await this.productRepository.findOne(id);
        
        if (product) {
            product.deletedAt = new DateGenerator().generateTimestamp();
            await this.productRepository.save(product);
            return true;
        }
    }
}