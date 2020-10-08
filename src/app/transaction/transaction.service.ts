import { getConnection, Repository } from "typeorm";
import validator from "validator";
import { Transaction } from "../../database/entities/transaction.entity";
import { FindAllDTO, StoreTransactionDTO, UpdateTransctionDTO } from "./transaction.dto";

export class TransactionService {
    private transactionRepository: Repository<Transaction>;

    constructor() {
        this.transactionRepository = getConnection().getRepository<Transaction>(Transaction);
    }

    async totalRecord() {
        return await this.transactionRepository.count();
    }

    async findAll({size, page, startDate, endDate}: FindAllDTO): Promise<Transaction[]> {
        const take = size ? size : 10;
        const skip = page ? page-1 : 0;

        if (startDate !== undefined && endDate !== undefined) {
            return await this.transactionRepository
            .createQueryBuilder("transactions")
            .leftJoinAndSelect("transactions.transactionDetails", "transaction_details")
            .leftJoinAndSelect("transaction_details.productSnapshot", "product_snapshots")
            .leftJoinAndSelect("product_snapshots.productVariant", "product_details")
            .where("transactions.date between :startDate and :endDate", {startDate: startDate, endDate: endDate})
            .take(take)
            .skip(skip)
            .getMany();
        } else {
            return await this.transactionRepository.find({
                join: {
                    alias: "transaction",
                    leftJoinAndSelect: {
                        transactionDetail: "transaction.transactionDetails",
                        productSnapshot: "transactionDetail.productSnapshot",
                        productVariant: "productSnapshot.productVariant",
                        product: "productVariant.product"
                    }
                },
                take: take,
                skip: skip
            });
        }
    }

    async findOne(id: string): Promise<Transaction|undefined> {
        return await this.transactionRepository.findOne(id, {
            join: {
                alias: "transaction",
                leftJoinAndSelect: {
                    transactionDetail: "transaction.transactionDetails",
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
        transaction.date = body.date;
        const result = await this.transactionRepository.save(transaction);
        return result;
    }

    async update(body: UpdateTransctionDTO, id: string): Promise<Transaction|undefined> {
        const transaction = await this.transactionRepository.findOne();        
        if (transaction) {
            transaction.note = body.note + "";
            transaction.date = body.date;
            const result = await this.transactionRepository.save(transaction);
            return result;
        }
    }

    async delete(id: string): Promise<true|undefined> {
        const transaction = await this.transactionRepository.findOne(id);
        
        if (transaction) {
            this.transactionRepository.remove(transaction);
            return true;
        }
    }
}