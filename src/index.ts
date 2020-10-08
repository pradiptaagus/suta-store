import { App } from "./app";
import dotenv from "dotenv";
import { createConnection } from "typeorm";
import { ProductController } from "./app/product/product.controller";
import { VersionController } from "./app/version/version.controller";
import { TransactionController } from "./app/transaction/transaction.controller";

dotenv.config();
const defaultPort: number = 1200;
const port = process.env.APP_PORT ? process.env.APP_PORT : defaultPort;

createConnection().then(() => {
    const app = new App([
        new ProductController(),
        new VersionController(),
        new TransactionController()
    ], port);
    app.listen();
}).catch(error => {
    console.log('error: ', error);
});