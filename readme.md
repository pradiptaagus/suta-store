# Simple Store Management System

Simple web application for management store. Demo https://store-chasier.herokuapp.com.

## Getting Started

1. Clone the project.
2. Run `npm install` or `yarn install`.
3. Create `ormconfig.json` or copy `ormconfig.example.json` than rename to `ormconfig.json` for database configuration.
4. Run `npm run dev` or `yarn dev` to run project in development mode.

### Prerequisites

You need following stuff to be installed.

```
Node js version 8 or higher
MySQL or PostgreSQL
```

## Deployment

1. Run `npm run build` or `yarn build`.
2. Modify every word `src` in `ormconfig.json` to `dist`. For example `["src/database/entities/*{.ts,.js}"]` to `["dist/database/entities/*{.ts,.js}"]`.
3. Run `npm run start` or `yarn start`.

## Built With

* [Express](https://expressjs.com/)
* [express-validator](https://express-validator.github.io/docs/)
* [EJS](https://ejs.co/)
* [TypeORM](https://typeorm.io/#/)
* [Typescript](https://www.typescriptlang.org/)
* [ExcelJs](https://github.com/exceljs/exceljs)

## Authors

* **[Pradipta Agus](https://github.com/pradiptaagus)** - *Initial work*