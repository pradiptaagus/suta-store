import { App } from "./app";
import dotenv from "dotenv";
import { createConnection } from "typeorm";
import { ProductController } from "./app/product/product.controller";
import { VersionController } from "./app/version/version.controller";
import { TransactionController } from "./app/transaction/transaction.controller";
import { ProductDetailController } from "./app/product-detail/product-detail.controller";
import { DashboardController } from "./app/dashboard/dashboard.controller";

dotenv.config();
const defaultPort: number = 1200;
const port = process.env.PORT ? process.env.PORT : defaultPort;

createConnection().then(() => {
    const app = new App([
        new ProductController(),
        new VersionController(),
        new TransactionController(),
        new ProductDetailController(),
        new DashboardController()
    ], port);
    app.listen();
}).catch(error => {
    console.log('error: ', error);
});