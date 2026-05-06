import type { Request, Response } from "express";
import type {  UserImageResponse } from "../types/user";
import type { GroupOverviewResponse } from "../types/user";
import { getUserImageData, getGroupOverviewData } from "../services/userServices";

export const getGroupOverview = async (req: Request, res: Response) => {
    if (!req.userId) {
        return res.status(400).json({ message: "Missing User ID" });
    }

    try {
        const responseBody: GroupOverviewResponse = await getGroupOverviewData(req.userId);
        return res.status(200).json(responseBody);
    } catch(err) {
        console.error(`Failed to fetch group overview for ${req.userId}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getUserImage = async (req: Request, res: Response) => {
    if (!req.userId) {
        return res.status(400).json({message: "Missing User ID"});
    }

    try {
        const responseBody: UserImageResponse = await getUserImageData(req.userId);
        return res.status(200).json(responseBody);
    } catch(err) {
        console.error(`Failed to fetch user image for ${req.userId}`);
        return res.status(500).json({message: "Internal Server Error"});
    }
}
