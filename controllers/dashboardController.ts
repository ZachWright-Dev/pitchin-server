import type { Request, Response } from 'express';
import type { DashboardRequest, DashboardResponse } from '../types/dashboard';
import { getDashboardData } from '../services/dashboardService';

export const getDashboardInfo = async(req: Request, res: Response) => {
    const requestBody: DashboardRequest = req.body;
    const { user_id } = requestBody;
    if (!user_id) {
        return res.json({message: "Missing User ID"});
    }
    try {
        const responseBody: DashboardResponse = await getDashboardData(user_id);
        return res.json(responseBody);
    } catch (err) {
        console.error("/dashboard network call failed", err);
        return res.status(500).json({message: "Internal server error"});
    }
}