import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import * as inventoryService from "../services/inventory.service";

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.createItem(req.body);
  res.status(201).json({ success: true, data: item });
});

export const getAllItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await inventoryService.getAllItems();
  res.status(200).json({ success: true, count: items.length, data: items });
});

export const getItemById = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.getItemById(req.params.id);
  res.status(200).json({ success: true, data: item });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.updateItem(req.params.id, req.body);
  res.status(200).json({ success: true, data: item });
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  await inventoryService.deleteItem(req.params.id);
  res.status(200).json({ success: true, message: "Item deleted successfully" });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { delta } = req.body as { delta: number };
  if (typeof delta !== "number" || Number.isNaN(delta)) {
    throw ApiError.badRequest('"delta" must be a number (e.g. -5 to remove, 10 to add)');
  }
  const item = await inventoryService.adjustStock(req.params.id, delta);
  res.status(200).json({ success: true, data: item });
});
