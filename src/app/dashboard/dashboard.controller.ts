import { Request, Response, NextFunction } from "express";
import { Router } from "express";

export class DashboardController {
    private path: string = "/";
    private router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get(this.path, this.findAll);
    }
    async findAll(req: Request, res: Response, next: NextFunction) {
        res.render("index.ejs");
    }
}