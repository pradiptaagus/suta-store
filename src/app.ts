import express, { Application, json, urlencoded } from "express";
import cors from "cors";
import path from "path";

export class App {
    public app: Application;
    public port: number|string;

    constructor(controllers: any[], port: number|string) {
        this.app = express();
        this.port = port;
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(json());
        this.app.use(urlencoded({extended: true}));
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "ejs");
        this.app.use('/js', express.static(path.join(__dirname, "public/js")));
        this.app.use('/css', express.static(path.join(__dirname, "public/css")));
    }

    private initializeControllers(controllers: any[]) {
        controllers.forEach((controller) => {
            this.app.use(controller.router);
        });
    }

    listen() {
        this.app.listen(
            this.port, 
            () => console.log(`Server started at port: ${this.port}`)
        );
    }
}