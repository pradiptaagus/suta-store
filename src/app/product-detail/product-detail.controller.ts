import { Request, Response, Router } from "express";
import { ResponseBuilder } from "../../helpers/response-builder.helper";
import { ProductDetailService } from "./product-detail.service";

export class ProductDetailController {
    private path = "/api/product-detail";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.delete(`${this.path}/:id`, this.delete);
    }

    async delete(req: Request, res: Response) {
        const id = req.params.id;

        // Check if product detail is exist
        const selectedProductVariant = await new ProductDetailService().findOne(id);
        if (!selectedProductVariant) return new ResponseBuilder().findOneResponse(res, false, `product detail`);

        const productDetail = await new ProductDetailService().delete(id);
        if (!productDetail) return new ResponseBuilder().internalServerError(res);
        return new ResponseBuilder().deleteResponse(res, true, `product detail`);
    }
}