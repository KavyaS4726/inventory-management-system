import { Request, Response } from "express";
import { createOrder, getAllOrders, getOrderById } from "../services/order.service";
import { getBuyerOrderSummary } from "../services/order.service";

export const getBuyerOrderSummaryHandler = async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params;
    const summary = await getBuyerOrderSummary(buyerId);
    return res.status(200).json({ success: true, data: summary });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const createOrderHandler = async (req: Request, res: Response) => {
  try {
    const performedBy = {
      uid: (req as any).user.uid,
      email: (req as any).user.email,
    };
    const order = await createOrder(req.body, performedBy);
    return res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllOrdersHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAllOrders(req.query as any);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch orders", error: error.message });
  }
};

export const getOrderByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};