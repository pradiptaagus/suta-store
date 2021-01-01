import { Request, Response, NextFunction, Router } from "express";
import { ProductService } from "./product.service";
import { check, validationResult } from "express-validator";
import { ProductDetailService } from "../product-detail/product-detail.service";
import { StoreProductDetailDTO, UpdateProductDetailDTO } from "../product-detail/product-detail.dto";
import { CountProductDto, FindAllProductDTO, StoreProductDTO, UpdateProductDTO } from "./product.dto";
import { ResponseBuilder } from "../../helpers/response-builder.helper";

export class ProductController {
    private path = "/api/product";
    private viewPath = "/product";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get(this.path, this.findAll);
        this.router.get(`${this.path}/:id`, this.findOne);
        this.router.post(this.path, this.store);
        this.router.put(`${this.path}/update-stock/:id`, this.addStock);
        this.router.put(`${this.path}/:id`, this.update);
        this.router.delete(`${this.path}/:id`, this.delete);
        this.router.get(this.viewPath, this.index);
        this.router.get(`${this.viewPath}/new`, this.add);
        this.router.get(`${this.viewPath}/edit/:id`, this.edit);
        this.router.get(`${this.viewPath}/add-stock/:id`, this.addStockView);
        this.router.get(`${this.viewPath}/:id`, this.view);
    }

    index(req: Request, res: Response) {
        res.render("product/index.ejs");
    }

    add(req: Request, res: Response) {
        res.render("product/add.ejs");
    }

    edit(req: Request, res: Response) {
        res.render("product/edit.ejs", {
            id: req.params.id
        });
    }

    view(req: Request, res: Response) {
        res.render("product/detail.ejs", {
            id: req.params.id
        });
    }

    addStockView(req: Request, res: Response) {
        res.render("product/add-stock.ejs", {
            id: req.params.id
        });
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
        const storageType = req.query.storageType ? (
            req.query.storageType === "store" ? "store" : (
                req.query.storageType === "warehouse" ? "warehouse" : ""
                )
            ) : "";
        
        const query: FindAllProductDTO = {
            code: req.query?.code?.toString(),
            name: req.query?.name?.toString(),
            size: size, 
            page: page,
            storageType: storageType
        }

        const countQuery: CountProductDto = {
            code: req.query?.code?.toString(),
            name: req.query?.name?.toString(),
            storageType: storageType
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
            storageType: string,
            qty: number,
            productVariants: {
                qtyPerUnit: number,
                price: number,
                unit: string,
                isParent: boolean,
                childIndex: number
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
        await check("storageType")
            .notEmpty().bail().withMessage("Storage type field is required!")
            .isIn(['store', 'warehouse']).withMessage("Product storage type field value must be store or warehouse!")
            .run(req);
        await check("qty")
            .notEmpty().bail().withMessage("Quantity field is required!")
            .isNumeric().withMessage("Quantity field value should be number!")
            .run(req);
        await check("productVariants").notEmpty().withMessage("Product variants is required!").run(req);
        await check("productVariants.*.unit").notEmpty().withMessage("Product unit field is required!").run(req);
        await check("productVariants.*.qtyPerUnit")
            .notEmpty().bail().withMessage("Product quantity per unit field is required!")
            .isNumeric().withMessage("Product qiantity per unit field value should be number")
            .run(req);
        await check("productVariants.*.price")
            .notEmpty().bail().withMessage("Product price field is required!")
            .isNumeric().withMessage("Product price field value should be number")
            .run(req);
        await check("productVariants.*.isParent")
            .notEmpty().bail().withMessage("Is parent field is required!")
            .isIn([0, 1]).withMessage("Is parent field value is not valid!")
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
            storageType: body.storageType,
            qty: body.qty
        }

        // Store product
        const product = await new ProductService().store(productBody);
        if (!product) {
            return new ResponseBuilder().internalServerError(res);
        }

        /**
         * Create temporary array to save store product variant result.
         * It's used to fill childId
         */
        let productVariantsTemp: {
            index: number,
            productVariantId: string
        }[] = [];

        // Loop to create product variant
        const productVariants = body.productVariants;
        for (let i = 0; i < productVariants.length; i++) {
            // Store product variant body
            const productVariantBody: StoreProductDetailDTO = {
                productId: product.id,
                qtyPerUnit: productVariants[i].qtyPerUnit,
                price: productVariants[i].price,
                unit: productVariants[i].unit,
                isParent: productVariants[i].isParent
            };
            
            const storeProductVariantResult = await new ProductDetailService().store(productVariantBody);
            if (!storeProductVariantResult) {
                return new ResponseBuilder().internalServerError(res);
            }

            // Add storeProductVariantResult to productVariantsTemp
            productVariantsTemp.push({
                index: i,
                productVariantId: storeProductVariantResult.id
            });
        }

        // Loop for assign child
        for (let i = 0; i < productVariantsTemp.length; i++) {
            const productVariantBody: UpdateProductDetailDTO = {
                productId: product.id,
                qtyPerUnit: productVariants[i].qtyPerUnit,
                price: productVariants[i].price,
                unit: productVariants[i].unit,
                isParent: productVariants[i].isParent,
                childId: productVariants[i].childIndex ? productVariantsTemp[(+productVariants[i].childIndex) - 1].productVariantId : ""
            }

            const updateProductVariantResult = await new ProductDetailService().update(productVariantBody, productVariantsTemp[i].productVariantId);
        }

        const data = await new ProductService().findOne(product.id)
        return new ResponseBuilder().storeResponse(res, true, `product`, data);
    }

    async update(req: Request, res: Response, next: NextFunction) {
        // Request body mapping
        const body: {
            name: string,
            code: string,
            storageType: string,
            qty: number,
            productVariants: {
                id: string,
                qtyPerUnit: number,
                price: number,                
                unit: string,
                isParent: boolean,
                childIndex: number
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
                const product = await (await new ProductService().findAll({code: value})).filter(item => {
                    return item.id !== id;
                });
                if (product.length > 0) {
                    return Promise.reject("Code is already in use!")
                }
            })
            .run(req);
        await check("name").notEmpty().withMessage("Name field is required!").run(req);
        await check("storageType")
            .notEmpty().bail().withMessage("Storage type field is required!")
            .isIn(['store', 'warehouse']).withMessage("Storage type field value must be store or warehouse!")
            .run(req);
        await check("qty")
            .notEmpty().bail().withMessage("Quantity field is required!")
            .isNumeric().withMessage("Quantity field value should be number!")
            .run(req);
        await check("productVariants").notEmpty().withMessage("Product variants is required!").run(req);
        await check("productVariants.*.unit").notEmpty().withMessage("Product unit field is required!").run(req);
        await check("productVariants.*.qtyPerUnit")
            .notEmpty().bail().withMessage("Product quantity per unit field is required!")
            .isNumeric().withMessage("Product qiantity per unit field value should be number")
            .run(req);
        await check("productVariants.*.price")
            .notEmpty().bail().withMessage("Product price field is required!")
            .isNumeric().withMessage("Product price field value should be number")
            .run(req)
        await check("productVariants.*.isParent")
            .notEmpty().bail().withMessage("Is parent field is required!")
            .isIn([0, 1]).withMessage("Is parent field value is not valid!")
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
            storageType: body.storageType,
            qty: body.qty
        }

        // Update product
        const product = await new ProductService().update(productBody, id);
        if (!product) {
            return new ResponseBuilder().internalServerError(res);
        }

        /**
         * Create temporary array to save store product variant result.
         * It's used to fill childId
         */
        let productVariantsTemp: {
            index: number,
            productVariantId: string
        }[] = [];

        /**
         * Loop productVariants array
         * To perform create or update product detail
         */
        const productVariants = body.productVariants;
        for (let i = 0; i < productVariants.length; i++) {
            const productVariantId = productVariants[i].id;

            if (!productVariantId) {
                // Store product detail
                const productVariantBody: StoreProductDetailDTO = {
                    productId: product.id,
                    qtyPerUnit: productVariants[i].qtyPerUnit,
                    price: productVariants[i].price,
                    unit: productVariants[i].unit,
                    isParent: productVariants[i].isParent
                }
                const storeProductVariantResult = await new ProductDetailService().store(productVariantBody);
                if (!storeProductVariantResult) {
                    return new ResponseBuilder().internalServerError(res);
                }
                // Add storeProductVariantResult to productVariantsTemp
                productVariantsTemp.push({
                    index: i,
                    productVariantId: storeProductVariantResult.id
                });
            } else if (productVariantId) {
                // Update product detail
                const productVariant = await new ProductDetailService().findOne(productVariantId);
                if (!productVariant) continue;
                const productVariantBody: UpdateProductDetailDTO = {
                    productId: product.id,
                    qtyPerUnit: productVariants[i].qtyPerUnit,
                    price: productVariants[i].price,
                    unit: productVariants[i].unit,
                    isParent: productVariants[i].isParent
                };

                const updateProductVariantResult = await new ProductDetailService().update(productVariantBody, productVariantId);
                if (!updateProductVariantResult) {
                    return new ResponseBuilder().internalServerError(res);
                }

                // Add storeProductVariantResult to productVariantsTemp
                productVariantsTemp.push({
                    index: i,
                    productVariantId: updateProductVariantResult.id
                });
            }
        }

        // Loop for assign child
        for (let i = 0; i < productVariantsTemp.length; i++) {
            const updateProductVariantBody: UpdateProductDetailDTO = {
                productId: product.id,
                qtyPerUnit: productVariants[i].qtyPerUnit,
                price: productVariants[i].price,
                unit: productVariants[i].unit,
                isParent: productVariants[i].isParent,
                childId: productVariants[i].childIndex ? productVariantsTemp[(+productVariants[i].childIndex) - 1].productVariantId : ""
            }
            const updateProductVariantResult = await new ProductDetailService().update(updateProductVariantBody, productVariantsTemp[i].productVariantId);
        }
        
        const data = await new ProductService().findOne(product.id);
        return new ResponseBuilder().updateResponse(res, true, `product`, data);
    }

    /**
     * 
     * @param req 
     * @param res 
     * @param next 
     */
    async addStock(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        const body: {
            additionQty: number // smallest quantity unit
        } = req.body;
        
        // Check if product already exist
        const selectedProduct = await new ProductService().findOne(id);
        if (!selectedProduct) {
            return new ResponseBuilder().findOneResponse(res, false, `product`);
        }

        // Validate request
        await check("additionQty")
            .notEmpty().bail().withMessage("Addition stock field is required!")
            .isNumeric().withMessage("Addition stock field value must be number!")
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

        // Update product stock
        const newQty = +body.additionQty + selectedProduct.qty;
        const addStockResult = await new ProductService().updateStock(newQty, id);
        if (!addStockResult) {
            return new ResponseBuilder().internalServerError(res);
        }

        const data = await new ProductService().findOne(id);
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