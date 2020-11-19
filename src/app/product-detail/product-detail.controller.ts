import { Request, Response, Router } from "express";
import { ResponseBuilder } from "../../helpers/response-builder.helper";
import { CountProductDetailDto, FindAllProductDetailDto } from "./product-detail.dto";
import { ProductDetailService } from "./product-detail.service";

export class ProductDetailController {
    private path = "/api/product-detail";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get(this.path, this.findAll);
        this.router.get(`${this.path}/:id`, this.findOne);
        this.router.delete(`${this.path}/:id`, this.delete);
    }

    async findAll(req: Request, res: Response) {
        const size = req.query?.size ? +req.query.size : 10;
        const page = req.query?.page ? +req.query.page : 1;

        const query: FindAllProductDetailDto = {
            productName: req.query?.productName?.toString(),
            size: size,
            page: page,
        }

        const countQuery: CountProductDetailDto = {
            productName: req.query?.productName?.toString()
        }

        const productDetails = await new ProductDetailService().findAll(query);
        const totalRecord = await new ProductDetailService().totalRecord(countQuery);
        const totalPage = Math.ceil(totalRecord / size);

        let status = productDetails ? true : false;

        const data = {
            data: productDetails,
            pagination: {
                size: query.size,
                page: query.page,
                totalPage: totalPage,
                totalRecord: totalRecord
            }
        }

        return new ResponseBuilder().findResponse(res, status, `product detail`, data);
    }

    async findOne(req: Request, res: Response) {
        const id = req.params.id;
        const productDetail = await new ProductDetailService().findOne(id);
        let status = productDetail ? true : false;
        return new ResponseBuilder().findOneResponse(res, status, `product detail`, productDetail);
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