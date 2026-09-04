import { Request, Response } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/product.service";

export const createProductHandler = async (req: Request, res: Response) => {
  try {
    const { name, categoryId, supplierId, quantity, unitPrice, reorderThreshold } = req.body;

    if (!name || !categoryId || !supplierId) {
      return res.status(400).json({ message: "name, categoryId, and supplierId are required" });
    }

    const product = await createProduct({
      name,
      categoryId,
      supplierId,
      quantity: quantity ?? 0,
      unitPrice: unitPrice ?? 0,
      reorderThreshold: reorderThreshold ?? 0,
    });

    return res.status(201).json(product);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

export const getAllProductsHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAllProducts(req.query as any);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

export const getProductByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    return res.status(200).json(product);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch product", error: error.message });
  }
};

export const updateProductHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateProduct(id, req.body);
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

export const deleteProductHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteProduct(id);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};