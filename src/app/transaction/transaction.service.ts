import { Between, getConnection, Raw, Repository } from "typeorm";
import { Transaction } from "../../database/entities/transaction.entity";
import { CountTransactionDTO, FindAllTransactionDTO, StoreTransactionDTO, UpdateTransctionDTO } from "./transaction.dto";
import { DateGenerator } from "../../helpers/date-generator.helper";

export class TransactionService {
    private transactionRepository: Repository<Transaction>;

    constructor() {
        this.transactionRepository = getConnection().getRepository<Transaction>(Transaction);
    }

    async totalRecord(query: CountTransactionDTO) {
        const startDate = query.startDate;
        const endDate = query.endDate;

        const whereClause: Record<string, any> = {};
        if ((!startDate || startDate !== "undefined") && (!endDate || endDate !== "undefined")) whereClause.date = Between(startDate, endDate);

        return await this.transactionRepository.count({
            join: {
                alias: "transaction",
                leftJoin: {
                    transactionDetail: "transaction.transactionDetail",
                    productSnapshot: "transactionDetail.productSnapshot",
                    productVariant: "productSnapshot.productVariant",
                    product: "productVariant.product"
                }
            },
            where: whereClause
        });
    }

    async findAll(query: FindAllTransactionDTO): Promise<Transaction[]> {
        const take = query.size ? query.size : 10;
        const skip = query.page ? (query.page - 1) * take : 0;
        const startDate = query.startDate;
        const endDate = query.endDate;

        const whereClause: Record<string, any> = {};
        if (startDate !== "undefined" && endDate !== "undefined") whereClause.date = Between(startDate, endDate);

        return await this.transactionRepository.find({
            join: {
                alias: "transaction",
                leftJoinAndSelect: {
                    transactionDetail: "transaction.transactionDetail",
                    productSnapshot: "transactionDetail.productSnapshot",
                    productVariant: "productSnapshot.productVariant",
                    product: "productVariant.product"
                }
            },
            where: whereClause,
            take: take,
            skip: skip
        });
    }

    async findOne(id: string): Promise<Transaction|undefined> {
        return await this.transactionRepository.findOne(id, {
            join: {
                alias: "transaction",
                leftJoinAndSelect: {
                    transactionDetail: "transaction.transactionDetail",
                    productSnapshot: "transactionDetail.productSnapshot",
                    productVariant: "productSnapshot.productVariant",
                    product: "productVariant.product"
                }
            }
        });
    }

    async store(body: StoreTransactionDTO): Promise<Transaction> {
        const transaction = new Transaction();
        transaction.note = body.note + "";        
        if (!transaction.date || transaction.date === undefined) {
            const current = new Date();
            const year = current.getFullYear();
            const month = current.getMonth();
            const date = current.getDate();
            const fullDate = `${year}-${month}-${date}`;
            transaction.date = fullDate;
        }
        transaction.transactionTotal = body.transactionTotal ? body.transactionTotal : 0;
        const result = await this.transactionRepository.save(transaction);
        return result;
    }

    async update(body: UpdateTransctionDTO, id: string): Promise<Transaction|false> {
        console.log("masuk update");
        const transaction = await this.transactionRepository.findOne(id);        
        console.log("transaksi yg diupdate: ", transaction);
        if (!transaction) return false;

        transaction.note = body.note + "";        
        if (!transaction.date || transaction.date === undefined) {
            const current = new Date();
            const year = current.getFullYear();
            const month = current.getMonth();
            const date = current.getDate();
            const fullDate = `${year}-${month}-${date}`;
            transaction.date = fullDate;
        }
        transaction.transactionTotal = body.transactionTotal ? body.transactionTotal : 0;
        const result = await this.transactionRepository.save(transaction);
        return result;
        
    }

    async delete(id: string): Promise<true|undefined> {
        const transaction = await this.transactionRepository.findOne(id);
        
        if (transaction) {
            await this.transactionRepository
                .createQueryBuilder()
                .update()
                .set({deletedAt: new DateGenerator().generateTimestamp()})
                .where("id = :id", {id: id})
                .execute();
            return true;
        }
    }
}