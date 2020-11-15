import { Request, Response, NextFunction, Router } from "express";
import { ProductService } from "./product.service";
import { check, validationResult } from "express-validator";
import { ProductDetailService } from "../product-detail/product-detail.service";
import { StoreProductDetailDTO, UpdateProductDetailDTO } from "../product-detail/product-detail.dto";
import { CountProductDto, FindAllProductDTO, StoreProductDTO, UpdateProductDTO } from "./product.dto";
import { ResponseBuilder } from "../../helpers/response-builder.helper";

export class ProductController {
    private path = "/product";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get(this.path, this.findAll);
        this.router.get(`${this.path}/:id`, this.findOne);
        this.router.post(this.path, this.store);
        this.router.put(`${this.path}/:id`, this.update);
        this.router.delete(`${this.path}/:id`, this.delete);
    }

    /**
     * Return data of product
     * @param req.query.size: number
     * @param req.query.page: number
     * @param res 
     * @param next 
     */
    async findAll(req: Request, res: Response, next: NextFunction) {
        const size = req.query?.size ? +req.query.size : 10;
        const page = req.query?.page ? +req.query.page : 1;
        
        const query: FindAllProductDTO = {
            code: req.query?.code?.toString(),
            name: req.query?.name?.toString(),
            size: size, 
            page: page
        }

        const countQuery: CountProductDto = {
            code: req.query?.code?.toString(),
            name: req.query?.name?.toString()
        }

        const products = await new ProductService().findAll(query);
        const totalRecord = await new ProductService().totalRecord(countQuery);
        const totalPage = Math.ceil(totalRecord / size);

        let status = products ? true : false;

        const data = {
            data: products,
            pagination: {
                size: query.size,
                page: query.page,
                totalPage: totalPage,
                totalRecord: totalRecord
            }
        }

        return new ResponseBuilder().findResponse(res, status, `product`, data);
    }

    /**
     * Return data of product which identfied by uuid
     * @param req.params.id
     * @param res 
     * @param next 
     */
    async findOne(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        const product = await new ProductService().findOne(id);
        let status = product ? true : false;
        return new ResponseBuilder().findOneResponse(res, status, `product`, product);
    }

    /**
     * Create new product
     * @param req.body
     * @param res 
     * @param next 
     */
    async store(req: Request, res: Response, next: NextFunction) {
        // Request body mapping
        const body: {
            name: string,
            code: string,
            productVariants: {
                qty: number,
                price: number,
                storageType: string,
                unit: string
            }[]
        } = req.body;

        // Validate request
        await check("code")
            .notEmpty().bail().withMessage("Code field is required!")
            .isLength({min: 6}).bail().withMessage("Code field length minimum 6 characters!")
            .custom(async value => {
                const product = await new ProductService().findAll({code: value});
                if (product.length > 0) {
                    return Promise.reject("Code already in use!")
                }
            })
            .run(req);
        await check("name").notEmpty().withMessage("Name field is required!").run(req);
        await check("productVariants").notEmpty().withMessage("Product variants is required!").run(req);
        await check("productVariants.*.unit").notEmpty().withMessage("Product unit field is required!").run(req);
        await check("productVariants.*.qty")
            .notEmpty().bail().withMessage("Product quantity field is required!")
            .isNumeric().withMessage("Product qiantity field value should be number")
            .run(req);
        await check("productVariants.*.price")
            .notEmpty().bail().withMessage("Product price field is required!")
            .isNumeric().withMessage("Product price field value should be number")
            .run(req)
        await check("productVariants.*.storageType")
            .notEmpty().bail().withMessage("Product storage type field is required!")
            .isIn(['store', 'warehouse']).withMessage("Product storage type field value must be store or warehouse!")
            .run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let errorMessages: any = {};
            errors.array().forEach(err => {
                errorMessages[err.param] = err.msg;
            });
            return new ResponseBuilder().storeResponse(res, false, `product`, errorMessages);
        }
        // End validate request

        // Create store product DTO (Data Transfer Object)
        const productBody: StoreProductDTO = {
            code: body.code,
            name: body.name,
        }

        // Store product
        const product = await new ProductService().store(productBody);
        if (!product) {
            return new ResponseBuilder().internalServerError(res);
        }

        // Loop for create product variant
        const productVariants = body.productVariants;
        for (let i = 0; i < productVariants.length; i++) {
            // Store product variant body
            const productVariantBody: StoreProductDetailDTO = {
                productId: product.id,
                qty: productVariants[i].qty,
                price: productVariants[i].price,
                storageType: productVariants[i].storageType,
                unit: productVariants[i].unit
            };
            const storeProductVariantResult = await new ProductDetailService().store(productVariantBody);
            if (!storeProductVariantResult) {
                return new ResponseBuilder().internalServerError(res);
            }

        }

        const data = await new ProductService().findOne(product.id)
        return new ResponseBuilder().storeResponse(res, true, `product`, data);
    }

    async update(req: Request, res: Response, next: NextFunction) {
        // Request body mapping
        const body: {
            name: string,
            code: string,
            isActive: number,
            productVariants: {
                id: string,
                qty: number,
                price: number,
                storageType: string,
                unit: string,
                productId: string
            }[]
        } = req.body;

        // Get parameter request
        const id = req.params.id;

        /**
         * Check if product is already exist.
         * If exist, product can be updated.
         * Otherwise, it will return error
         */
        const selectedProduct = await new ProductService().findOne(id);
        if (!selectedProduct) {
            return new ResponseBuilder().findOneResponse(res, false, `product`);
        }

        // Validate request
        await check("code")
            .notEmpty().bail().withMessage("Code field is required!")
            .isLength({min: 6}).bail().withMessage("Code field length minimum 6 characters!")
            .custom(async value => {
                const product = await (await new ProductService().findAll({code: value, size: 1})).filter(item => {
                    return item.code !== value;
                });
                if (product.length > 0) {
                    return Promise.reject("Code already is use!")
                }
            })
            .run(req);
        await check("name").notEmpty().withMessage("Name field is required!").run(req);
        await check("productVariants").notEmpty().withMessage("Product variants is required!").run(req);
        await check("productVariants.*.unit").notEmpty().withMessage("Product unit field is required!").run(req);
        await check("productVariants.*.qty")
            .notEmpty().bail().withMessage("Product quantity field is required!")
            .isNumeric().withMessage("Product qiantity field value should be number")
            .run(req);
        await check("productVariants.*.price")
            .notEmpty().bail().withMessage("Product price field is required!")
            .isNumeric().withMessage("Product price field value should be number")
            .run(req)
        await check("productVariants.*.storageType")
            .notEmpty().bail().withMessage("Product storage type field is required!")
            .isIn(['store', 'warehouse']).withMessage("Product storage type field value must be store or warehouse!")
            .run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let errorMessages: any = {};
            errors.array().forEach(err => {
                errorMessages[err.param] = err.msg;
            });
            return new ResponseBuilder().updateResponse(res, false, `product`, errorMessages);
        }
        // End validate request

        // Create update product DTO (Data Transfer Object)
        const productBody: UpdateProductDTO = {
            code: body.code,
            name: body.name,
        }

        // Update product
        const product = await new ProductService().update(productBody, id);
        if (!product) {
            return new ResponseBuilder().internalServerError(res);
        }

        /**
         * Loop productVariants array
         * To update product detail
         */
        const productVariants = body.productVariants;    
        for (let i = 0; i < productVariants.length; i++) {
            const productVariantId = productVariants[i].id;
            const productVariant = await new ProductDetailService().findOne(productVariantId);

            if (productVariant) {
                const prodVar: UpdateProductDetailDTO = {
                    productId: product.id,
                    qty: productVariants[i].qty,
                    price: productVariants[i].price,
                    unit: productVariants[i].unit,
                    storageType: productVariants[i].storageType
                };
                const updateProductDetailResult = await new ProductDetailService().update(prodVar, productVariantId);
                if (!updateProductDetailResult) {
                    return new ResponseBuilder().internalServerError(res);
                }
            } else {
                const prodVar: StoreProductDetailDTO = {
                    productId: product.id,
                    qty: productVariants[i].qty,
                    price: productVariants[i].price,
                    unit: productVariants[i].unit,
                    storageType: productVariants[i].storageType
                }
                const storeProductDetailResult = await new ProductDetailService().store(prodVar);
                if (!storeProductDetailResult) {
                    return new ResponseBuilder().internalServerError(res);
                }
            }
        }
        
        const data = await new ProductService().findOne(product.id);
        return new ResponseBuilder().updateResponse(res, true, `product`, data);
    }

    /**
     * Delete product
     * @param req.params.id 
     * @param res 
     * @param next 
     */
    async delete(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;

        // Check if product already exist
        const selectedProduct = await new ProductService().findOne(id);
        if (!selectedProduct) {
            return new ResponseBuilder().findOneResponse(res, false, `product`);
        }

        // Delete product
        const product = await new ProductService().delete(id);
        if (!product) {
            return new ResponseBuilder().internalServerError(res);
        }
        return new ResponseBuilder().deleteResponse(res, true, `product`);
    }
}