import { getConnection, Like, Repository } from "typeorm";
import { Product } from "../../database/entities/product.entity";
import { StoreProductDTO, UpdateProductDTO, FindAllProductDTO, CountProductDto } from "./product.dto";
import { DateGenerator } from "../../helpers/date-generator.helper";

export class ProductService {
    private productRepository: Repository<Product>;

    constructor() {
        this.productRepository = getConnection().getRepository<Product>(Product);
    }

    async totalRecord(query: CountProductDto) {
        const code = query.code;
        const name = query.name;

        const whereClause: Record<string, any> = {};
        if (code) whereClause.code = code;
        if (name) whereClause.name = name;

        return await this.productRepository.count({
            relations: ["productVariant"],
            where: whereClause
        });
    }

    async findAll(query: FindAllProductDTO): Promise<Product[]> {
        const take = query.size ? query.size : 10;
        const skip = query.page ? (query.page - 1) * take : 1;
        const code = query.code;
        const name = query.name;

        const whereClause: object[] = [];
        if (code) whereClause.push({code: Like(`%${code}%`)});
        if (name) whereClause.push({name: Like(`%${name}%`)});
        console.log(whereClause)

        return await this.productRepository.find({
            relations: ["productVariant"],
            where: whereClause,
            take: take,
            skip: skip
        });
    }

    async findOne(id: string): Promise<Product | undefined> {
        return await this.productRepository.findOne(id, {
            relations: ["productVariant"]
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