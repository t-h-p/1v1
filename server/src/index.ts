import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: '../.env'});
import { createServer } from "node:http";
import { Server, type DefaultEventsMap,  type Socket } from "socket.io";

import { authService } from "./user.js";
import { registerUserSocket, type SocketData } from "./signalingConnection.js";

const port = 8080;
const app = express();
const server = createServer(app);
const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

app.get('/', (_, res) => {
    res.send('Hello in there...')
});

io.on('connection', (socket) => {
  socket.on('login-request', async (data) => {
    const {name, password} = data;
    console.log(`Received login request from ${name}`)
    try {
      let user = await authService.loginUser(name, password);
      if (!user) {
        user = await authService.registerUser(name, password); 
      }
      if (user) {
        registerUserSocket(socket, user);
        socket.emit('login-success', {uuid: user.uuid});
      } else {
        throw new Error("Could not register user.")
      }
    } catch (err) {
      console.log(err);
      socket.emit('error','Login failed')
    }
  })

  socket.on('webrtc-offer', (data) => {
    const {sdp, toUuid, fromUuid} = data;
    
    const room = io.sockets.adapter.rooms.get(toUuid);

    if (room && room.size > 0) {
      io.to(toUuid).emit('webrtc-offer', {
        sdp: sdp,
        fromUuid: fromUuid,
        toUuid: toUuid
      });
    } else {
      socket.emit('error', {uuid: toUuid});
    }
  })
})


server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})