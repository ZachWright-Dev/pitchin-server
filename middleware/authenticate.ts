import type { Request, Response, NextFunction } from "express";
import { decode } from "@auth/core/jwt";
import { SessionCookieName } from "../config/constants";

if (!process.env.AUTH_SECRET) {
    console.error("Cannot authenticate users without secret!");
    process.exit(1);
}

if (!process.env.APP_ENV) {
    console.error("Please specify an APP_ENV!");
    process.exit(1);
}
const AUTH_SECRET: string = process.env.AUTH_SECRET;
const APP_ENV: string = process.env.APP_ENV;
const salt = SessionCookieName[APP_ENV as keyof typeof SessionCookieName];

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    // Client must prefix with Bearer
    const token: string | undefined = req.headers.authorization?.split(' ')[1];

    if(token === undefined) {
        return res.status(401).json({"message":"No Token Provided"});
    }

    try {
        await decode({token, secret: AUTH_SECRET, salt});
        next();
    } catch (e) {
        console.error("Invlalid Token");
        return res.status(401).json({"message": "Invalid Token"});
    }

}
export default authenticate;