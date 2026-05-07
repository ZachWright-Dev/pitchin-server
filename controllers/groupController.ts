import type { Request, Response } from "express";
import type { GroupRequest, GroupImageResponse, CreateGroupRequest, CreateGroupResponse, GetReceiptDataResponse, GetGroupMembersResponse } from "../types/groups";
import { getGroupImageData, getParsedReceiptData, createGroupAsync, getReceiptDataAsync, getGroupMembersAsync } from "../services/groupService";

export const createGroup = async (req: Request, res: Response) => {
    const requestBody: CreateGroupRequest = req.body;
    const { name, receipt } = requestBody;
    if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!name || !receipt) {
        return res.status(400).json({ message: "Groups require name and receipt" });
    }

    try {
        const responseBody: CreateGroupResponse = await createGroupAsync(requestBody, req.userId);
        console.log("parsing service response")
        return res.status(201).json(responseBody);
    } catch(err) {
        console.error(`Failed to create a group for user: ${req.userId}`);
        console.error(err)
        return res.status(500).json({message: "Internal Server Error"});
    }

}

export const getGroupImage = async (req: Request, res: Response) => {
    const requestBody: GroupRequest = req.body;
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

export const getParsedReceipt = async (req: Request, res: Response) => {
    const requestBody = req.body;
    const { base64Image, mimeType } = requestBody;
    if (!base64Image || !mimeType) {
        console.error(`Receipt parsing usage error, base64Image: ${base64Image} and mimeType: ${mimeType}`);
        return res.status(400).json({message: "Missing Base64 String Image"});
    }

    try {
        const data = await getParsedReceiptData(base64Image, mimeType);
        return res.status(200).json(data);
    } catch(err) {
        console.error("Failed to parse items", err);
        return res.status(500).json({ success: false, error: "Gemini threw an error" });
    }
}

export const getReceiptData = async (req: Request, res: Response) => {
    const requestBody: GroupRequest = req.body;
    const { group_id } = requestBody;
    if (!group_id) {
        console.error("Please Include group ID")
        return res.status(400).json({ message: "Please include groupId"});
    }
    try {
        const responseBody: GetReceiptDataResponse = await getReceiptDataAsync(group_id);
        return res.status(201).json(responseBody);
    } catch(err) {
        console.error(`Failed to get receipt data for group: ${group_id}`, err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getGroupMembers = async (req: Request, res: Response) => {
    const requestBody: GroupRequest = req.body;
    const { group_id } = requestBody;
    if (!group_id) {
        console.error("Please Include group ID")
        return res.status(400).json({ message: "Please Inlude groupId"});
    }
    try {
        const responseBody: GetGroupMembersResponse = await getGroupMembersAsync(group_id);
        return res.status(201).json(responseBody);
    } catch(err){
        console.error(`Failed to fetch group members for group ${group_id}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
