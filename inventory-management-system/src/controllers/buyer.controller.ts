import { Request, Response } from "express";
import {
  createBuyer,
  getAllBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
} from "../services/buyer.service";

export const createBuyerHandler = async (req: Request, res: Response) => {
  try {
    const buyer = await createBuyer(req.body);
    return res.status(201).json({ success: true, data: buyer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to create buyer", error: error.message });
  }
};

export const getAllBuyersHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAllBuyers(req.query as any);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch buyers", error: error.message });
  }
};

export const getBuyerByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const buyer = await getBuyerById(id);
    return res.status(200).json({ success: true, data: buyer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch buyer", error: error.message });
  }
};

export const updateBuyerHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateBuyer(id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to update buyer", error: error.message });
  }
};

export const deleteBuyerHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteBuyer(id);
    return res.status(200).json({ success: true, message: "Buyer deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to delete buyer", error: error.message });
  }
};