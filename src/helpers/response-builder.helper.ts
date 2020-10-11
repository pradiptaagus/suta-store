import { Response } from "express";

export class ResponseBuilder {
    private statusCode = {
        success: 200,
        created: 201,
        badRequest: 400,
        unAuthorized: 401,
        forbidden: 403,
        internalServerError: 500
    }

    findResponse(res: Response, status: true|false, context: string, data: any) {
        if (!status) {
            return this.internalServerError(res);
        }
        return res.status(this.statusCode.success).json({
            success: true,
            message: `Success to retrieve ${context} data.`,
            data: data
        });
    }

    findOneResponse(res: Response, status: true|false, context: string, data?: any) {
        if (!status) {
            return res.status(this.statusCode.badRequest).json({
                success: true,
                message: `${context.replace(context.substr(0,1), context.substr(0,1).toLocaleUpperCase())} not found!`
            });
        }
        return res.status(this.statusCode.success).json({
            success: true,
            message: `Success to retrieve ${context} data.`,
            data: data
        });
    }

    storeResponse(res: Response, status: true|false, context: string, data: any) {
        if (!status) {
            return res.status(this.statusCode.badRequest).json({
                success: false,
                message: `Failed to create ${context}!`,
                errors: data
            });
        }
        return res.status(this.statusCode.created).json({
            success: true,
            message: `Success to create ${context}.`,
            data: data
        });
    }

    updateResponse(res: Response, status: true|false, context: string, data: any) {
        if (!status) {
            return res.status(this.statusCode.badRequest).json({
                success: false,
                message: `Failed to update ${context}!`,
                errors: data
            });
        }
        return res.status(this.statusCode.created).json({
            success: true,
            message: `Success to update ${context}.`,
            data: data
        });
    }

    deleteResponse(res: Response, status: true|false, context: string) {
        if (!status) {
            return res.status(this.statusCode.badRequest).json({
                success: false,
                message: `Failed to delete ${context}!`
            });
        }
        return res.status(this.statusCode.success).json({
            success: true,
            message: `Success to delete ${context}.`
        });
    }

    customResponse(res: Response, status: true|false, message: string, data?: any) {
        if (!status) {
            const errorResponse: any = {};
            errorResponse.success = false;
            errorResponse.message = message;
            data ? errorResponse.error = data : null;
            return res.status(this.statusCode.badRequest).json(errorResponse)
        }

        const response: any = {};
        response.success = true;
        response.message = message;
        data ? response.data = data : null;
        return res.status(this.statusCode.success).json(response);
    }

    internalServerError(res: Response) {
        return res.status(this.statusCode.internalServerError).json({
            success: false,
            message: `Internal server error!`
        });
    }
}