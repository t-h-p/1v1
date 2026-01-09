import {v4 as uuidv4} from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { pool } from  "./db.js";

export interface User {
    readonly uuid: string;
    name: string;
    passwordHash: string;
}

const createUser = (name: string, passwordHash: string): User => ({
    uuid: uuidv4(),
    name,
    passwordHash
});


class AuthService {

  private hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    return passwordHash;
  }

  private userLookup = async (name: string): Promise<User | null> => {
    let conn;

    try {
      conn = await pool.getConnection(); 
      const user = await conn.query("SELECT uuid,name,passwordHash FROM users WHERE name = ?", [name]) as User[];
      return user[0] || null;

    } catch (err) {
      console.log(err);
      return null;

    } finally {
      if (conn) conn.release();
    } 
  }

  private registerUser = async (name: string, passwordHash: string): Promise<User | null> => {
    let conn;
    const uuid = uuidv4();
    try {

      conn = await pool.getConnection();
      const result = await conn.query("INSERT INTO users (uuid, name, passwordHash) VALUES (?,?,?)", [uuid, name, passwordHash]);
      const newUser = await this.userLookup(name);
      return newUser;

    } catch (err) {
      console.log(err);
      return null;

    } finally {
      if (conn) conn.release();
    }
  }

  loginUser = async (name: string, passwordHash: string): Promise<User | null> => {
    let user = await this.userLookup(name);

    if (!user) {
      console.log(`User '{name}' didn't exist, creating new entry.`);
      user = await this.registerUser(name, passwordHash);
    } else if (passwordHash != user.passwordHash) {
      user = null;
    }

    return user;

  }
};

export const authService = new AuthService();