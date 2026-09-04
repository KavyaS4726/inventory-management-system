import { Request, Response } from "express";
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../services/supplier.service";

export const createSupplierHandler = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone || !email || !address) {
      return res.status(400).json({ message: "name, phone, email, and address are required" });
    }

    const supplier = await createSupplier({ name, phone, email, address });
    return res.status(201).json(supplier);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to create supplier", error: error.message });
  }
};

export const getAllSuppliersHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAllSuppliers(req.query as any);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch suppliers", error: error.message });
  }
};

export const getSupplierByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await getSupplierById(id);
    return res.status(200).json(supplier);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch supplier", error: error.message });
  }
};

export const updateSupplierHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    const updated = await updateSupplier(id, { name, phone, email, address });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to update supplier", error: error.message });
  }
};

export const deleteSupplierHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteSupplier(id);
    return res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to delete supplier", error: error.message });
  }
};