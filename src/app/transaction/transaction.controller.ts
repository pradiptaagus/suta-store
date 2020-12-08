import { Router, Request, Response, NextFunction } from "express";
import { TransactionService } from "./transaction.service";
import { check, validationResult } from "express-validator";
import { ProductSnapshotDTO } from "../product-snapshot/product-snapshot.dto";
import { ProductSnapshotService } from "../product-snapshot/product-snapshot.service";
import validator from "validator";
import { ProductDetailService } from "../product-detail/product-detail.service";
import { CountTransactionDTO, FindAllTransactionDTO, StoreTransactionDTO, UpdateTransctionDTO } from "./transaction.dto";
import { DateValidator } from "../../helpers/date-validator.helper";
import { ResponseBuilder } from "../../helpers/response-builder.helper";

export class TransactionController {
    private path: string = "/api/transaction";
    private viewPath: string = "/transaction";
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
        this.router.get(this.viewPath, this.index);
        this.router.get(`${this.viewPath}/new`, this.add);
        this.router.get(`${this.viewPath}/:id`, this.view);
        this.router.get(`/cashier`, this.cashier);
    }

    index(req: Request, res: Response) {
        res.render("transaction/index.ejs");
    }

    add(req: Request, res: Response) {
        res.render("transaction/add.ejs");
    }

    view(req: Request, res: Response) {
        res.render("transaction/detail.ejs", {
            id: req.params.id
        });
    }

    cashier(req: Request, res: Response) {
        res.render("transaction/cashier.ejs");
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

        if (startDate !== "undefined" && endDate !== "undefined") {
            if (!dateValidator.validate(startDate) || !dateValidator.validate(endDate)) {
                return new ResponseBuilder().customResponse(res, false, `Start date and end date value should be date!`);
            }
        }

        const query: FindAllTransactionDTO = {
            size: size, 
            page: page,
            startDate: startDate,
            endDate: endDate
        }

        const countQuery: CountTransactionDTO = {
            startDate: startDate,
            endDate: endDate
        }

        const products = await new TransactionService().findAll(query);
        const totalRecord = await new TransactionService().totalRecord(countQuery);
        const totalPage = Math.ceil(totalRecord / size);
        
        const data = {
            data: products,
            pagination: {
                size: size,
                page: page,
                totalPage: Math.ceil(totalPage),
                totalRecord: totalRecord
            }
        }
        return new ResponseBuilder().findResponse(res, true, `transaction`, data);
    }

    /**
     * Return data of transaction which identified by uuid
     * @param req.params.id: uuid 
     * @param res 
     * @param next 
     */
    async findOne(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        const transaction = await new TransactionService().findOne(id);
        let status = transaction ? true : false;
        return new ResponseBuilder().findOneResponse(res, status, `transaction`, transaction);
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
            date: string,
            note: string,
            discount: number,
            paymentAmount: number;
            productSnapshots: {
                productVariantId: string,
                qty: number,
                discount: number|string
            }[]
        } = req.body;

        // Get transaction detail array
        const productSnapshots = body.productSnapshots;

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
        await check("discount")
            .isNumeric().withMessage("Discount field value is not valid!")
            .run(req);
        await check("paymentAmount")
            .notEmpty().withMessage("Payment amount field is required!")
            .isNumeric().withMessage("Payment amount field value is not valid!")
            .run(req);
        await check("productSnapshots").notEmpty().withMessage("Products is required!").run(req);
        await check("productSnapshots.*.productVariantId")
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
        await check("productSnapshots.*.qty")
            .notEmpty().bail().withMessage("Product quantity field is required!")
            .isNumeric({no_symbols: true}).bail().withMessage("Product quantity field value should be number!")
            .run(req);
        await check("productSnapshots.*.discount")
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
            return new ResponseBuilder().storeResponse(res, false, `transaction`, errorMessages);
        }
        // End validate request

        // Check transaction details body
        const productSnapshotErrors: any = {};
        for (let i = 0; i < productSnapshots.length; i++) {
            const transactionDetail = productSnapshots[i];
            const productVariant = await new ProductDetailService().findOne(transactionDetail.productVariantId);

            // Check availability of product variant
            if (!productVariant) {
                productSnapshotErrors[`productSnapshots[${i}].productVariantId`] = "Product variant not found!";
            }
            // Check product variant stock
            else if (transactionDetail.qty > productVariant.qty) {
                productSnapshotErrors[`productSnapshots[${i}].qty`] = "Product quantity requested is exceed the limit!";
            }
        }

        if (Object.keys(productSnapshotErrors).length > 0) {
            return new ResponseBuilder().storeResponse(res, false, `transaction`, productSnapshotErrors);
        }

        // Create store transaction DTO (Data Transfer Object)
        const transactionBody: StoreTransactionDTO = {
            note: body.note,
            date: body.date,
            discount: body.discount,
            transactionTotal: 0,
            paymentAmount: body.paymentAmount
        }

        // Store transaction
        const transaction = await new TransactionService().store(transactionBody);
        if (!transaction) {
            return new ResponseBuilder().internalServerError(res);
        }

        // Loop for create new product snapshot and transaction detail
        let transactionTotal: number = 0;
        for (let i = 0; i < productSnapshots.length; i++) {
            // Get transaction detail item [i] from productSnapshots array
            const transactionDetail = productSnapshots[i];
            
            // Get product variant from database
            const productVariant = await new ProductDetailService().findOne(transactionDetail.productVariantId);
            if (!productVariant) continue;

            /**
             * Determine discount value.
             * If discount is undefined or value is empty, discount value is 0.
             * Otherwise, use discount from request body.
             */
            let discount = 0;
            if (
                transactionDetail.discount &&
                transactionDetail.discount !== undefined
            ) {
                discount = +transactionDetail.discount;
            }

            /**
             * Calculate total price based on product variant price and transaction detail discount.
             * If discount exist, the price will be calculated with formula => (price - discount).
             * Otherwise, the price will be same as product variant price
             */
            const totalPrice = discount ? 
                productVariant.price - discount 
                    : productVariant.price;

            // Calculate total price
            const subTotal = totalPrice * (+transactionDetail.qty);
            
            // Add subTotal to transactionTotal
            transactionTotal = transactionTotal + subTotal;

            // Create product snapshot DTO (Data Transfer Object)
            const productSnapshotBody: ProductSnapshotDTO = {
                productVariantId: productVariant.id,
                transactionId: transaction.id,
                code: productVariant.product.code,
                name: productVariant.product.name,
                unit: productVariant.unit,
                qty: +transactionDetail.qty,
                price: productVariant.price,
                discount: discount,
                totalPrice: totalPrice,
                subTotal: subTotal
            }

            // Store product snapshot
            const productSnapshot = await new ProductSnapshotService().store(productSnapshotBody);
            if (!productSnapshot) {
                return new ResponseBuilder().internalServerError(res);
            }

            // Reduce product variant stock
            const newQuantity = productVariant.qty - transactionDetail.qty;
            const reduceProductVariantStockResult = new ProductDetailService().updateStock(newQuantity, productVariant.id);
            if (!reduceProductVariantStockResult) {
                return new ResponseBuilder().internalServerError(res);
            }
        }

        // Update transaction total
        const updateBody: UpdateTransctionDTO = {
            note: body.note,
            date: body.date,
            discount: body.discount,
            transactionTotal: transactionTotal - body.discount,
            paymentAmount: body.paymentAmount
        }
        const updateTransactionResult = await new TransactionService().update(updateBody, transaction.id);

        const data = await new TransactionService().findOne(transaction.id);
        return new ResponseBuilder().storeResponse(res, true, `transaction`, data);
    }

    /**
     * Update transaction
     * @param req.body
     * @param req.param.id
     * @param res 
     * @param next 
     */
    async update(req: Request, res: Response, next: NextFunction) {
        // Request body mapping
        const body: {
            date: string,
            note: string,
            discount: number,
            paymentAmount: number,
            productSnapshot: {
                id: string,
                qty: number,
                discount?: number,
                productVariantId: string
            }[]
        } = req.body;
        
        // Get transaction details array
        const productSnapshots = body.productSnapshot;

        // Get parameter request
        const id = req.params.id;

        /**
         * Check if transaction is already exist.
         * Transaction exist can be updated.
         * If transction doesn't exist will throw error response.
         */ 
        const selectedTransaction = await new TransactionService().findOne(id);
        if (!selectedTransaction) {
            return new ResponseBuilder().findOneResponse(res, false, `transaction`);
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
        await check("discount")
            .isNumeric().withMessage("Discount field value is not valid!")
            .run(req);
        await check("paymentAmount")
            .notEmpty().withMessage("Payment amount field is required!")
            .isNumeric().withMessage("Payment amount field value is not valid!")
            .run(req);
        await check("productSnapshots").notEmpty().withMessage("Products is required!").run(req);
        await check("productSnapshots.*.qty")
            .notEmpty().bail().withMessage("Product quantity field is required!")
            .isNumeric({no_symbols: true}).bail().withMessage("Product quantity field value should be number!")
            .run(req);
        await check("productSnapshots.*.discount")
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
        await check("productSnapshots.*.productVariantId")
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
            return new ResponseBuilder().updateResponse(res, false, `transaction`, errorMessages);
        }
        // End validate request

        // Check product snapshot body
        const productSnapshotErrors: any = {};
        for (let i = 0; i < productSnapshots.length; i ++) {
            const transactionDetail = productSnapshots[i];
            const productVariant = await new ProductDetailService().findOne(transactionDetail.productVariantId);

            // Check availability of product variant
            if (!productVariant) {
                productSnapshotErrors[`productSnapshots[${i}].productVariantId`] = "Product variant not found!";
            }
            // Check product variant stock
            else if (productVariant && !(productVariant.qty > transactionDetail.qty)) {
                productSnapshotErrors[`productSnapshots[${i}].qty`] = "Product quantity requested is exceed the limit!";
            }
        }

        if (Object.keys(productSnapshotErrors).length > 0) {
            return new ResponseBuilder().updateResponse(res, false, `transaction`, productSnapshotErrors);
        }

        // Create update transaction DTO (Data Transfer Object)
        const transactionBody: UpdateTransctionDTO = {
            note: body.note,
            date: body.date,
            discount: body.discount,
            transactionTotal: 0,
            paymentAmount: body.paymentAmount
        }

        // Update transaction
        const transaction = await new TransactionService().update(transactionBody, id);
        if (!transaction) {
            return new ResponseBuilder().internalServerError(res);
        }
        
        /**
         * Loop productSnapshots array 
         * to update transaction detail and product snapshot
         */        
        let transactionTotal: number = 0;
        for (let i = 0; i < productSnapshots.length; i++) {
            // Get transaction detail item [i] from productSnapshots array
            const transactionDetail = productSnapshots[i];

            /**
             * Get product variant object from database.
             * Product variant id will be used on product snapshot modification.
             * If product variant doesn't exist, it's mean there's no desired product variant
             * and product snapshot modifcation coludn't be done.
             */
            const productVariant = await new ProductDetailService().findOne(transactionDetail.productVariantId);
            if (!productVariant) continue;

            /**
             * Determine discount value.
             * If discount is undefined or value is empty, discount value is 0.
             * Otherwise, use discount from request body.
             */
            let discount = 0;
            if (
                transactionDetail.discount &&
                transactionDetail.discount !== undefined
            ) {
                discount = transactionDetail.discount;
            }

            /**
             * Generate total price based on product variant price and discount.
             * If discount exist, the price will be calculated with formula => (price - discount) * quantity.
             * Otherwise, the price will be same as product variant price
             */
            const totalPrice = discount 
                ? productVariant.price - discount
                    : productVariant.price

            // Calculate total price
            const subTotal = totalPrice * transactionDetail.qty;
            
            // Add subTotal to transactionTotal
            transactionTotal = transactionTotal + subTotal;

            // Create product snapshot DTO (Data Transfer Object)
            const productSnapshotBody: ProductSnapshotDTO = {
                productVariantId: productVariant.id,
                transactionId: transaction.id,
                code: productVariant.product.code,
                name: productVariant.product.name,
                unit: productVariant.unit,
                qty: +transactionDetail.qty,
                price: productVariant.price,
                discount: discount,
                totalPrice: totalPrice,
                subTotal: subTotal
            }

            /**
             * Execute this section when transaction detail id and product variant exist.
             * This section goal is to modify product snapshot.
             */
            if (transactionDetail.id && transactionDetail.id) {
                /** 
                 * Reduce product variant stock
                 * New product variant stock = (old product variant stock + old product snapshot stock) - new product snapshot stock
                 */
                const selectedProductSnapshot = await new ProductSnapshotService().findOne(transactionDetail.id);
                if (!selectedProductSnapshot) continue;
                const newQuantity = (productVariant.qty + selectedProductSnapshot.qty) - transactionDetail.qty;
                const reduceProductVariantStockResult = new ProductDetailService().updateStock(newQuantity, productVariant.id);
                if (!reduceProductVariantStockResult) {
                    return new ResponseBuilder().internalServerError(res);
                }
                
                // Update product snapshot
                const productSnapshot = await new ProductSnapshotService().update(productSnapshotBody, transactionDetail.id);
                if (!productSnapshot) {
                    return new ResponseBuilder().internalServerError(res);
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
                    return new ResponseBuilder().internalServerError(res);
                }

                // Reduce product variant stock
                const newQuantity = productVariant.qty - transactionDetail.qty;
                const reduceProductVariantStockResult = new ProductDetailService().updateStock(newQuantity, productVariant.id);
                if (!reduceProductVariantStockResult) {
                    return new ResponseBuilder().internalServerError(res);
                }               
            }
        }

        // Update transaction total
        const updateBody: UpdateTransctionDTO = {
            note: body.note,
            date: body.date,
            discount: body.discount,
            transactionTotal: transactionTotal - body.discount,
            paymentAmount: body.paymentAmount
        }
        await new TransactionService().update(updateBody, transaction.id);

        const data = await new TransactionService().findOne(id)
        return new ResponseBuilder().updateResponse(res, false, `transaction`, data);
    }

    /**
     * Delete transaction
     * @param req.params.id
     * @param res 
     * @param next 
     */
    async delete(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;

        // Check if transaction already exist
        const selectedTransaction = await new TransactionService().findOne(id);
        if (!selectedTransaction) {
            return new ResponseBuilder().findOneResponse(res, false, `transaction`);
        }

        // Delete transaction
        const product = await new TransactionService().delete(id);
        return new ResponseBuilder().deleteResponse(res, true, `transaction`);
    }
}