import { Request, Response } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../services/category.service";

export const createCategoryHandler = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await createCategory({ name, description });
    return res.status(201).json(category);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to create category", error: error.message });
  }
};

export const getAllCategoriesHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAllCategories(req.query as any);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
};

export const getCategoryByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json(category);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch category", error: error.message });
  }
};

export const updateCategoryHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updated = await updateCategory(id, { name, description });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to update category", error: error.message });
  }
};

export const deleteCategoryHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    await deleteCategory(id);
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to delete category", error: error.message });
  }
};