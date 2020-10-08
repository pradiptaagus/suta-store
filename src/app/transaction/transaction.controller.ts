import { Router, Request, Response, NextFunction } from "express";
import { TransactionService } from "./transaction.service";
import { check, validationResult } from "express-validator";
import { TransactionDetailDTO } from "../transaction-detail/transaction-detail.dto";
import { TransactionDetailService } from "../transaction-detail/transaction-detail.service";
import { ProductSnapshotDTO } from "../product-snapshot/product-snapshot.dto";
import { ProductSnapshotService } from "../product-snapshot/product-snapshot.service";
import validator from "validator";
import { ProductDetailService } from "../product-detail/product-detail.service";
import { StoreTransactionDTO, UpdateTransctionDTO } from "./transaction.dto";
import { DateValidator } from "../../helpers/date-validator.helper";

export class TransactionController {
    private path: string = "/transaction";
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    // Initialize routes
    initializeRoutes() {
        this.router.get(this.path, this.findAll);
        this.router.get(`${this.path}/:id`, this.findOne);
        this.router.post(this.path, this.store);
        this.router.put(`${this.path}/:id`, this.update);
        this.router.delete(`${this.path}/:id`, this.delete);
    }

    /**
     * Return data of transactions
     * @param req.query.size: number
     * @param req.query.page: number
     * @param res 
     * @param next 
     */
    async findAll(req: Request, res: Response, next: NextFunction) {
        const size = req.query?.size ? +req.query.size : 10;
        const page = req.query?.page ? +req.query.page : 1;
        const startDate = req.query?.startDate+"";
        const endDate = req.query?.endDate+"";
        const dateValidator = new DateValidator();

        if (!dateValidator.validate(startDate) || !dateValidator.validate(endDate)) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date value should be date!",
            });
        }

        const products = await new TransactionService().findAll({
            size: size, 
            page: page,
            startDate: startDate,
            endDate: endDate
        });
        const totalRecord = await new TransactionService().totalRecord();
        const totalPage = Math.ceil(totalRecord / size)
        res.json({
            success: true,
            data: products,
            pagination: {
                size: size,
                page: page,
                totalPage: Math.ceil(totalPage),
                totalRecord: totalRecord
            }
        });
    }

    /**
     * Return data of transaction which identified by uuid
     * @param req.params.id: uuid 
     * @param res 
     * @param next 
     */
    async findOne(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        const product = await new TransactionService().findOne(id);
        res.json(product)
    }

    /**
     * Create new transaction
     * @param req.body
     * @param res 
     * @param next 
     */
    async store(req: Request, res: Response, next: NextFunction) {
        // Request body mapping
        const body: {
            date?: string,
            note?: string,
            transactionDetails: {
                productVariantId: string,
                qty: number,
                discount?: number
            }[]
        } = req.body;

        // Validate request
        await check("date")
            .custom(value => {
                if (!value || value === undefined) return true;
                if (!new DateValidator().validate(value)) {
                    return Promise.reject("Date field value should be date!")
                }
                return true;
            })
            .run(req);
        await check("note")
            .isString().withMessage("Note field required string input!")
            .trim()
            .run(req);
        await check("transactionDetails").notEmpty().withMessage("Products is required!").run(req);
        await check("transactionDetails.*.productVariantId")
            .notEmpty().bail().withMessage("Product variant field is required!")
            .custom(async(value: string) => {
                /**
                 * Validate productVariantId.
                 * If product variant not found, it will return error.
                 */
                const productVariant = await new ProductDetailService().findOne(value);
                if (!productVariant) {
                    return Promise.reject(`Product variant identified by ${value} doesn't exist!`);
                }
                return true;
            })
            .run(req);
        await check("transactionDetails.*.qty")
            .notEmpty().bail().withMessage("Product quantity field is required!")
            .isNumeric({no_symbols: true}).bail().withMessage("Product quantity field value should be number!")
            .custom(async(value: number) => {
                /**
                 * Validate quantity.
                 * If quantity exceed the available product quantity, it will return error
                 */
                const productVariant = await new ProductDetailService().findOne(body.transactionDetails[0].productVariantId);
                if (!productVariant) {
                    return Promise.reject(`Could't identify the amount of stock!`);
                }
                if (value > productVariant.qty) {
                    return Promise.reject(`Product quantity requested is exceed the limit!`);
                }
                return true;
            })
            .run(req);
        await check("transactionDetails.*.discount")
            .custom(value => {
                if (!value || value === undefined) return true;
                switch (value) {
                    case validator.isNumeric(value, {no_symbols: true}):
                        return Promise.reject("Product discount field value should be number!")
                    default:
                        return Promise.resolve(true)
                }
            })
            .run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let errorMessages: any = {};
            errors.array().forEach(err => {
                errorMessages[err.param] = err.msg;
            });
            return res.json({
                success: false,
                message: "Failed to create transaction!",
                errors: errorMessages
            });
        }
        // End validate request

        /**
         * Determine if request body has date value.
         * If doesn't exist, it will be automatically generated.
         */
        if (!body.date || body.date === undefined) {
            const current = new Date();
            const year = current.getFullYear();
            const month = current.getMonth();
            const date = current.getDate();
            const fullDate = `${year}-${month}-${date}`;
            body.date = fullDate;
        }

        // Create store transaction DTO (Data Transfer Object)
        const transactionBody: StoreTransactionDTO = {
            note: body.note,
            date: body.date
        }

        // Store transaction
        const transaction = await new TransactionService().store(transactionBody);
        if (!transaction) {
            return res.status(400).json({
                success: false,
                message: "Internal server error"
            });
        }

        // Loop for create new product snapshot and transaction detail
        const transactionDetails = body.transactionDetails;            
        for (let i = 0; i < transactionDetails.length; i++) {
            // Get transaction detail item [i] from transactionDetails array
            const transactionDetail = transactionDetails[i];

            /**
             * Get product variant object from database.
             * Product variant id will be used on product snapshot modification.
             * If product variant doesn't exist, it's mean there's no desired product variant
             * and product snapshot modifcation coludn't be done.
             */
            const productVariant = await new ProductDetailService().findOne(transactionDetail.productVariantId);
            if (!productVariant) {
                return res.status(400).json({
                    success: false,
                    message: "Internal server error"
                });
            }

            /**
             * Determine discount value.
             * If discount is undefined or value is empty, discount value is 0.
             * Otherwise, use discount from request body.
             */
            let discount = 0;
            if (
                transactionDetail.discount ||
                transactionDetail.discount !== undefined
            ) {
                discount = transactionDetail.discount;
            }

            /**
             * Generate total price based on product variant price and transaction detail discount.
             * If discount exist, the price will be calculated with formula => (price - discount) * quantity.
             * Otherwise, the price will be calculated with formula => price * quantity.
             */
            const totalPrice = discount ? 
                productVariant.price - discount 
                    : productVariant.price;

            // Create product snapshot DTO (Data Transfer Object)
            const productSnapshotBody: ProductSnapshotDTO = {
                productVariantId: productVariant.id,
                code: productVariant.product.code,
                name: productVariant.product.name,
                unit: productVariant.unit,
                qty: transactionDetail.qty,
                price: productVariant.price,
                discount: discount,
                totalPrice: totalPrice
            }

            // Store product snapshot
            const productSnapshot = await new ProductSnapshotService().store(productSnapshotBody);
            if (!productSnapshot) {
                return res.status(400).json({
                    success: false,
                    message: "Internal server error"
                });
            }

            // Create transaction detail DTO (Data Transfer Object)
            let transactionDetailBody: TransactionDetailDTO = {
                transactionId: transaction.id,
                productSnapshotId: productSnapshot.id
            };

            // Store transaction detail
            const storeTransactionDetailResult = await new TransactionDetailService().store(transactionDetailBody);
            if (!storeTransactionDetailResult) {
                return res.status(400).json({
                    success: false,
                    message: "Internal server error!"
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: "Transaction was created.",
            data: await new TransactionService().findOne(transaction.id)
        });
    }

    async update(req: Request, res: Response, next: NextFunction) {
        // Request body mapping
        const body: {
            date?: string,
            note?: string,
            transactionDetails: {
                id: string,
                productSnapshot: {
                    id: string,
                    qty: number,
                    discount?: number,
                    productVariantId: string
                }
            }[]
        } = req.body;

        // Get parameter request
        const id = req.params.id;

        /**
         * Check if transaction is already exist.
         * Transaction exist can be updated.
         * If transction doesn't exist will throw error response.
         */ 
        const selectedTransaction = await new TransactionService().findOne(id);
        if (!selectedTransaction) {
            return res.status(400).json({
                success: false,
                message: `Transaction identified by ${id} not found!`
            });
        }

        // Validate request
        await check("date")
            .notEmpty().bail().withMessage("Date field is required!")
            .isDate().withMessage("Date field value should be date!")
            .run(req);
        await check("note")
            .isString().withMessage("Note field required string input!")
            .trim()
            .run(req);
        await check("transactionDetails").notEmpty().withMessage("Products is required!").run(req);
        // await check("transactionDetails.*.productSnapshot.id").notEmpty().withMessage("Product variant field is required!").run(req);
        await check("transactionDetails.*.productSnapshot.qty")
            .notEmpty().bail().withMessage("Product quantity field is required!")
            .isNumeric({no_symbols: true}).bail().withMessage("Product quantity field value should be number!")
            .run(req);
        await check("transactionDetails.*.productSnapshot.discount")
            .custom(value => {
                if (!value || value === undefined) return true;
                switch (value) {
                    case validator.isNumeric(value, {no_symbols: true}):
                        return Promise.reject("Product discount field value should be number!")
                    default:
                        return Promise.resolve(true)
                }
            })
            .run(req);
        await check("transactionDetails.*.productSnapshot.productVariantId")
            .notEmpty().bail().withMessage("Product variant field is required!")
            .custom(async(value: string) => {
                /**
                 * Validate productVariantId.
                 * If product variant not found, it will return error.
                 */
                const productVariant = await new ProductDetailService().findOne(value);
                if (!productVariant) {
                    return Promise.reject(`Product variant identified by ${value} doesn't exist!`);
                }
                return true;
            })
            .run(req);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let errorMessages: any = {};
            errors.array().forEach(err => {
                errorMessages[err.param] = err.msg;
            });
            return res.json({
                success: false,
                message: "Failed to create transaction!",
                errors: errorMessages
            });
        }
        // End validate request

        // return res.json(body);
        
        /**
         * Determine if request body has date value.
         * If doesn't exist, it will be automatically generated.
         */
        if (!body.date || body.date === undefined) {
            const current = new Date();
            const year = current.getFullYear();
            const month = current.getMonth();
            const date = current.getDate();
            const fullDate = `${year}-${month}-${date}`;
            body.date = fullDate;
        }

        // Create update transaction DTO (Data Transfer Object)
        const transactionBody: UpdateTransctionDTO = {
            note: body.note,
            date: body.date,
        }

        // Update transaction
        const transaction = await new TransactionService().update(transactionBody, id);
        if (!transaction) {
            return res.status(400).json({
                success: false,
                message: "Internal server error"
            });
        }
        
        /**
         * Loop for update transaction detail body 
         * to update transaction detail and product snapshot
         */
        const transactionDetails = body.transactionDetails;
        for (let i = 0; i < transactionDetails.length; i++) {
            // Get transaction detail item [i] from transactionDetails array
            const transactionDetail = transactionDetails[i];

            /**
             * Get product variant object from database.
             * Product variant id will be used on product snapshot modification.
             * If product variant doesn't exist, it's mean there's no desired product variant
             * and product snapshot modifcation coludn't be done.
             */
            const productVariant = await new ProductDetailService().findOne(transactionDetail.productSnapshot.productVariantId);
            if (!productVariant) {
                return res.json({
                    success: false,
                    message: `Product variant identified by ${transactionDetail.productSnapshot.productVariantId} doesn't exist!`
                });
            }

            /**
             * Validate quantity.
             * If quantity exceed the available product quantity, it will return error
             */
            if (transactionDetail.productSnapshot.qty > productVariant.qty) {
                return res.json({
                    success: false,
                    message: "Failed to create transaction!",
                    [transactionDetails[i].productSnapshot.qty]: "Product quantity requested is exceed the limit!"
                });
            }

            /**
             * Determine discount value.
             * If discount is undefined or value is empty, discount value is 0.
             * Otherwise, use discount from request body.
             */
            let discount = 0;
            if (
                transactionDetail.productSnapshot.discount ||
                transactionDetail.productSnapshot.discount !== undefined
            ) {
                discount = transactionDetail.productSnapshot.discount;
            }

            /**
             * Generate total price based on product variant price and discount.
             * If discount exist, the price will be calculated with formula => (price - discount) * quantity.
             * Otherwise, the price will be calculated with formula => price * quantity.
             */
            const totalPrice = discount 
                ? ((productVariant.price - discount) * transactionDetail.productSnapshot.qty)
                    : productVariant.price * transactionDetail.productSnapshot.qty;

            // Create product snapshot DTO (Data Transfer Object)
            const productSnapshotBody: ProductSnapshotDTO = {
                productVariantId: productVariant.id,
                code: productVariant.product.code,
                name: productVariant.product.name,
                unit: productVariant.unit,
                qty: +transactionDetail.productSnapshot.qty,
                price: productVariant.price,
                discount: discount,
                totalPrice: totalPrice
            }

            /**
             * Execute this section when transaction detail id and product variant exist.
             * This section goal is to modify product snapshot.
             */
            if (transactionDetail.id && transactionDetail.productSnapshot.id) {
                // Update product snapshot
                const productSnapshot = await new ProductSnapshotService().update(productSnapshotBody, transactionDetail.productSnapshot.id);
                if (!productSnapshot) {
                    return res.status(400).json({
                        success: false,
                        message: "Internal server error!"
                    });
                }
            } 

            /** 
             * Execute this section when transaction detail id doesn't exist.
             * This section goals are to create new product snapshot and transaction detail.
             */
            else {
                // Store product snapshot 
                const productSnapshot = await new ProductSnapshotService().store(productSnapshotBody);                    
                if (!productSnapshot) {
                    return res.status(400).json({
                        success: false, 
                        message: "Internal server error!"
                    });
                }

                // Create transaction detail DTO (Data Transfer Object)
                const transactionDetailBody: TransactionDetailDTO = {
                    transactionId: id,
                    productSnapshotId: productSnapshot.id
                };

                const storeTransactionDetailResult = await new TransactionDetailService().store(transactionDetailBody);
                if (!storeTransactionDetailResult) {
                    return res.status(400).json({
                        success: false,
                        message: "Internal server error!"
                    });
                }                
            }
        }

        return res.json({
            success: true,
            message: `Transaction identified by ${id} was updated.`,
            data: await new TransactionService().findOne(id)
        });
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        const product = await new TransactionService().delete(id);
        res.json(product);
    }
}