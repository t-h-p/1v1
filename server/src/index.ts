import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: '../.env'})

import { AuthService } from "./user.js";

const app = express();
const port = 3000;



app.get('/', (_, res) => {
    res.send('Hello in there...')
});

app.listen(port, () => {
  const authService = new AuthService;
  const jwt = authService.loginUser("N/A","hello");
  console.log(jwt);
  console.log(`Listening on http://localhost:${port}`);
})