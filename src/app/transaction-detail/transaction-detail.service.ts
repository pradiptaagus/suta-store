import { getConnection, Repository } from "typeorm";
import { TransactionDetail } from "../../database/entities/transaction-detail.entity";
import { TransactionDetailDTO } from "./transaction-detail.dto";
import { TransactionService } from "../transaction/transaction.service";
import { ProductSnapshotService } from "../product-snapshot/product-snapshot.service";

export class TransactionDetailService {
    private transactionDetailReppository: Repository<TransactionDetail>;
    private transactionService: TransactionService;
    private productSnaphotService: ProductSnapshotService;

    constructor() {
        this.transactionDetailReppository = getConnection().getRepository<TransactionDetail>(TransactionDetail);
        this.transactionService = new TransactionService();
        this.productSnaphotService = new ProductSnapshotService();
    }

    async findAll(): Promise<TransactionDetail[]> {
        return await this.transactionDetailReppository.find();
    }

    async findOne(id: string): Promise<TransactionDetail|undefined> {
        return await this.transactionDetailReppository.findOne(id);
    }

    async store(body: TransactionDetailDTO): Promise<TransactionDetail|undefined> {
        const transaction = await this.transactionService.findOne(body.transactionId);
        const productSnaphot = await this.productSnaphotService.findOne(body.productSnapshotId);
        if (transaction && productSnaphot) {
            const transactionDetail = new TransactionDetail();
            transactionDetail.transaction = transaction;
            transactionDetail.productSnapshot = productSnaphot;
            const result = await this.transactionDetailReppository.save(transactionDetail);
            return result;
        }
    }

    async update(body: TransactionDetailDTO, id: string): Promise<TransactionDetail|undefined> {
        const product = await this.transactionDetailReppository.findOne(id);
        const transaction = await this.transactionService.findOne(body.transactionId);
        const productSnaphot = await this.productSnaphotService.findOne(body.productSnapshotId);
        if (transaction && productSnaphot && product) {
            const transactionDetail = new TransactionDetail();
            transactionDetail.transaction = transaction;
            transactionDetail.productSnapshot = productSnaphot;
            const result = await this.transactionDetailReppository.save(transactionDetail);
            return result;
        }
    }

    async delete(id: string): Promise<true|undefined> {
        const transactionDetail = await this.transactionDetailReppository.findOne(id);
        
        if (transactionDetail) {
            this.transactionDetailReppository.remove(transactionDetail);
            return true;
        }
    }
}