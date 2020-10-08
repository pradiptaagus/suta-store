import { Request, Response, NextFunction, Router, json } from "express";
import { ProductService } from "./product.service";
import { check, validationResult } from "express-validator";
import { ProductDetailService } from "../product-detail/product-detail.service";
import { ProductDetailDTO } from "../product-detail/product-detail.dto";

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

    async findAll(req: Request, res: Response, next: NextFunction) {
        const size = req.query?.size ? +req.query.size : 10;
        const page = req.query?.page ? +req.query.page : 1;

        const products = await new ProductService().findAll({
            code: req.query?.code?.toString(),
            name: req.query?.name?.toString(),
            isActive: req.query?.isActive !== undefined ? +req.query.isActive : 1,
            size: size, 
            page: page
        });
        return res.json({
            success: true,
            message: "Success to retrive product data.",
            data: products
        });
    }

    async findOne(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        const product = await new ProductService().findOne(id);
        if (product) {
            return res.json({
                success: true,
                message: "Success to retrive product data.",
                data: product
            });
        } else {
            return res.status(400).json({
                success: false,
                message: `Product identified by ${id} not found!`,
            });
        }
    }

    async store(req: Request, res: Response, next: NextFunction) {
        const body = req.body;

        await check("code")
            .notEmpty().bail().withMessage("Code field is required!")
            .isLength({min: 6}).bail().withMessage("Code field length minimum 6 characters!")
            .custom(async value => {
                const product = await new ProductService().findAll({code: value});
                if (product.length > 0) {
                    return Promise.reject("Code already is use!")
                }
            })
            .run(req);
        await check("name").notEmpty().withMessage("Name field is required!").run(req);
        await check("isActive")
            .notEmpty().bail().withMessage("Is active field is required!")
            .isIn([0,1]).withMessage("Is active field value must be (0 = false) or (1 = true)!")
            .run(req);
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
            return res.status(400).json({
                success: false,
                message: "Failed to create product!",
                errors: errorMessages
            });
        }

        const product = await new ProductService().store(body);
        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Internal Server error!",
            });
        }

        const productVariants = req.body.productVariants;
        for (let i = 0; i < productVariants.length; i++) {
            const productVariant: ProductDetailDTO = productVariants[i];
            productVariant.productId = product.id;
            await new ProductDetailService().store(productVariant);
        }

        return res.status(201).json({
            success: true,
            message: "Product was created.",
            data: await new ProductService().findOne(product.id)
        });
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const body = req.body;
        const id = req.params.id;

        const selectedProduct = await new ProductService().findOne(id);
        if (!selectedProduct) {
            return res.status(400).json({
                success: false,
                message: `Product identified by ${id} not found!`,
            });
        }

        await check("code")
            .notEmpty().bail().withMessage("Code field is required!")
            .isLength({min: 6}).bail().withMessage("Code field length minimum 6 characters!")
            .custom(async value => {
                const product = await (await new ProductService().findAll({code: value, size: 1})).filter(item => {
                    return item.id !== id;
                });
                if (product.length > 0) {
                    return Promise.reject("Code already is use!")
                }
            })
            .run(req);
        await check("name").notEmpty().withMessage("Name field is required!").run(req);
        await check("isActive")
            .notEmpty().withMessage("IsActive field is required!")
            .isIn([0,1]).withMessage("Is active field value must be (0 = false) or (1 = true)!")
            .run(req);
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
            return res.status(400).json({
                success: false,
                message: "Failed to create product!",
                errors: errorMessages
            });
        }

        const product = await new ProductService().update(body, id);
        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Internal Server error!",
            });
        }

        const productVariants = req.body.productVariants;    
        for (let i = 0; i < productVariants.length; i++) {
            const prodVar: ProductDetailDTO = productVariants[i];
            const productVariant = await new ProductDetailService().findOne(prodVar.id);

            if (productVariant) {
                console.log("update");
                const updateProductDetailResult = await new ProductDetailService().update(prodVar, prodVar.id);
                console.log(updateProductDetailResult);
            } else {
                console.log("create")
                await new ProductDetailService().store(prodVar);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Product identified by ${id} was updated.`,
            data: await new ProductService().findOne(product.id)
        });
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;

        const selectedProduct = await new ProductService().findOne(id);
        if (!selectedProduct) {
            return res.status(400).json({
                success: false,
                message: `Product identified by ${id} not found!`
            });
        }

        const product = await new ProductService().delete(id);
        if (product) {
            return res.json({
                success: true,
                message: `Product identified by ${id} was deleted.`
            });
        }
    }
}