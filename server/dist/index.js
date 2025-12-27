import express from "express";
const app = express();
const port = 80;
app.get('/', (_, res) => {
    res.send('Hello, world!');
});
//# sourceMappingURL=index.js.map