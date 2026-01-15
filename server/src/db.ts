import dotenv from "dotenv";
dotenv.config({ path: '../.env'});
import mariadb from "mariadb";


export const pool = mariadb.createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME!,
    connectionLimit: 5
})