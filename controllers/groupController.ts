import type { Request, Response } from "express"
import type { GroupImageRequest, GroupImageResponse } from "../types/groups";
import { getGroupImageData } from "../services/groupService";
export const getGroupImage = async (req: Request, res: Response) => {
    const requestBody: GroupImageRequest = req.body;
    const { group_id } = requestBody;
    if (!group_id) {
        return res.status(400).json({message: "Missing Group ID"});
    }

    try {
        const responseBody: GroupImageResponse = await getGroupImageData(group_id);
        return res.status(200).json(responseBody);
    } catch(err) {
        console.error(`Failed to fetch group image for ${group_id}`);
        return res.status(500).json({message: "Internal Server Error"});
    }
}
