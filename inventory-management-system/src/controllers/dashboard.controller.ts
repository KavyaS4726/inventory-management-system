import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service";

export const dashboardSummaryHandler = async (_req: Request, res: Response) => {
  try {
    const summary = await getDashboardSummary();
    return res.status(200).json(summary);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
  }
};