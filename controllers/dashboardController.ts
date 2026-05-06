import type { Request, Response } from 'express';
import type { DashboardResponse } from '../types/dashboard';
import { getDashboardData } from '../services/dashboardService';

export const getDashboardInfo = async(req: Request, res: Response) => {
    if (!req.userId) {
        return res.json({message: "Missing User ID"});
    }
    try {
        const responseBody: DashboardResponse = await getDashboardData(req.userId);
        return res.json(responseBody);
    } catch (err) {
        console.error("/dashboard network call failed", err);
        return res.status(500).json({message: "Internal server error"});
    }
}