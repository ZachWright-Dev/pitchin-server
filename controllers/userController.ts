import type { Request, Response } from "express";
import type { UserImageRequest, UserImageResponse } from "../types/user";
import type { GroupOverviewRequest, GroupOverviewResponse } from "../types/user";
import { getUserImageData, getGroupOverviewData } from "../services/userServices";

export const getGroupOverview = async (req: Request, res: Response) => {
    const requestBody: GroupOverviewRequest = req.body;
    const { user_id } = requestBody;
    if (!user_id) {
        return res.status(400).json({ message: "Missing User ID" });
    }

    try {
        const responseBody: GroupOverviewResponse = await getGroupOverviewData(user_id);
        return res.status(200).json(responseBody);
    } catch(err) {
        console.error(`Failed to fetch group overview for ${user_id}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getUserImage = async (req: Request, res: Response) => {
    const requestBody: UserImageRequest = req.body;
    const { user_id } = requestBody;
    if (!user_id) {
        return res.status(400).json({message: "Missing User ID"});
    }

    try {
        const responseBody: UserImageResponse = await getUserImageData(user_id);
        return res.status(200).json(responseBody);
    } catch(err) {
        console.error(`Failed to fetch user image for ${user_id}`);
        return res.status(500).json({message: "Internal Server Error"});
    }
}
