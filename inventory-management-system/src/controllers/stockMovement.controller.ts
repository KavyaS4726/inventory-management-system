import { Request, Response } from "express";
import {
  recordStockIn,
  recordStockOut,
  getStockHistory,
  getAllMovements,
  getSupplierStockHistory,
} from "../services/stockMovement.service";

export const stockInHandler = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, note, supplierId, unitPrice } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: "productId and quantity are required" });
    }
    if (!supplierId || unitPrice === undefined) {
      return res.status(400).json({ message: "supplierId and unitPrice are required for stock in" });
    }

    const performedBy = { uid: req.user!.uid, email: req.user!.email };

    const movement = await recordStockIn(productId, quantity, note, performedBy, supplierId, unitPrice);
    return res.status(201).json(movement);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to record stock in", error: error.message });
  }
};

export const stockOutHandler = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, note } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: "productId and quantity are required" });
    }

    const performedBy = { uid: req.user!.uid, email: req.user!.email };

    const movement = await recordStockOut(productId, quantity, note, performedBy);
    return res.status(201).json(movement);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to record stock out", error: error.message });
  }
};

export const stockHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const result = await getStockHistory(productId, req.query as any);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch stock history", error: error.message });
  }
};

export const getAllMovementsHandler = async (req: Request, res: Response) => {
  try {
    const movements = await getAllMovements();
    return res.status(200).json({ success: true, data: movements });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch stock movements", error: error.message });
  }
};

export const getSupplierHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const result = await getSupplierStockHistory(supplierId);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch supplier history", error: error.message });
  }
};