import type { Socket, DefaultEventsMap } from "socket.io";
import { type User } from "./user.js";

export interface SocketData {
    authenticated: boolean;
    user: {uuid: string, name: string, loginTime: Date};
}

export const registerUserSocket = (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>, user: User): void => {
    socket.data.authenticated = true;    
    const loginTime = new Date();
    socket.data.user = {uuid: user.uuid, name: user.name, loginTime: loginTime};
    socket.join(user.uuid);
}