import { getFirestore } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Category } from "../models/category.model";
import { ApiError } from "../utils/ApiError";
import { applyListQuery, ListQuery } from "../utils/queryHelper";

const db = getFirestore();
const collection = db.collection("categories");

/**
 * Create Category
 */
export async function createCategory(
  data: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<Category> {
  // Check duplicate name
  const existing = await collection
    .where("name", "==", data.name)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw ApiError.badRequest("Category already exists");
  }

  const category = {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await collection.add(category);

  return {
    id: docRef.id,
    ...category,
  };
}

/**
 * Get All Categories
 */

/**
 * Get All Categories
 */
export async function getAllCategories(query: ListQuery) {
  const snapshot = await collection.get();

  const categories = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Category, "id">),
  }));

  return applyListQuery(categories, query, {
    searchableFields: ["name"],
    filterableFields: [],
    defaultSortBy: "name",
    defaultLimit: 10,
  });
}

/**
 * Get Category By Id
 */
export async function getCategoryById(
  id: string
): Promise<Category> {
  const doc = await collection.doc(id).get();

  if (!doc.exists) {
    throw ApiError.notFound("Category not found");
  }

  return {
    id: doc.id,
    ...(doc.data() as Omit<Category, "id">),
  };
}

/**
 * Update Category
 */
export async function updateCategory(
  id: string,
  data: Partial<Category>
): Promise<Category> {
  const ref = collection.doc(id);

  const doc = await ref.get();

  if (!doc.exists) {
    throw ApiError.notFound("Category not found");
  }

  // Duplicate name check
  if (data.name) {
    const duplicate = await collection
      .where("name", "==", data.name)
      .limit(1)
      .get();

    if (!duplicate.empty && duplicate.docs[0].id !== id) {
      throw ApiError.badRequest("Category already exists");
    }
  }

  await ref.update({
    ...data,
    updatedAt: Timestamp.now(),
  });

  const updated = await ref.get();

  return {
    id: updated.id,
    ...(updated.data() as Omit<Category, "id">),
  };
}

/**
 * Delete Category
 */
export async function deleteCategory(
  id: string
): Promise<void> {
  const ref = collection.doc(id);

  const doc = await ref.get();

  if (!doc.exists) {
    throw ApiError.notFound("Category not found");
  }

  await ref.delete();
}