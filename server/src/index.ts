import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: '../.env'});
import { createServer } from "node:http";
import { Server, type DefaultEventsMap,  type Socket } from "socket.io";

import { authService } from "./user.js";
import { registerUserSocket, type SocketData } from "./connection.js";

const port = 3000;

const app = express();
const server = createServer(app);
const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(server);

app.get('/', (_, res) => {
    res.send('Hello in there...')
});

io.on('connection', (socket) => {
  socket.on('login-request', async (name, passwordHash) => {
    try {
      const user = await authService.loginUser(name, passwordHash);
      if (!user) {
        throw new Error(`Could not login to user ${name}`);
      }
      registerUserSocket(socket, user);
      socket.emit('login-success', {username: user?.name, });
    } catch (err) {
      console.log(err);
      socket.emit('error','Login failed')
    }
  })
})

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})