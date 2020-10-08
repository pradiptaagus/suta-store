import { Request, Response, NextFunction } from "express";
import { Router } from "express";

export class VersionController {
    private path: string = "/version";
    private router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get(this.path, this.findAll);
    }
    async findAll(req: Request, res: Response, next: NextFunction) {
        res.json("Suta store API V1")
    }
}