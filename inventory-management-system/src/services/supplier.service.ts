import { getFirestore } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Supplier } from "../models/supplier.model";
import { ApiError } from "../utils/ApiError";
import { applyListQuery, ListQuery } from "../utils/queryHelper";

const db = getFirestore();
const collection = db.collection("suppliers");

/**
 * Create Supplier
 */
export async function createSupplier(
  data: Omit<Supplier, "id" | "createdAt" | "updatedAt">
): Promise<Supplier> {
  const existing = await collection
    .where("name", "==", data.name)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw ApiError.badRequest("Supplier already exists");
  }

  const supplier = {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await collection.add(supplier);

  return {
    id: docRef.id,
    ...supplier,
  };
}

/**
 * Get All Suppliers
 */
export async function getAllSuppliers(query: ListQuery) {
  const snapshot = await collection.get();

  const suppliers = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Supplier, "id">),
  }));

  return applyListQuery(suppliers, query, {
    searchableFields: ["name", "email", "phone"],
    filterableFields: [],
    defaultSortBy: "name",
    defaultLimit: 10,
  });
}

/**
 * Get Supplier By Id
 */
export async function getSupplierById(id: string): Promise<Supplier> {
  const doc = await collection.doc(id).get();

  if (!doc.exists) {
    throw ApiError.notFound("Supplier not found");
  }

  return {
    id: doc.id,
    ...(doc.data() as Omit<Supplier, "id">),
  };
}

/**
 * Update Supplier
 */
export async function updateSupplier(
  id: string,
  data: Partial<Supplier>
): Promise<Supplier> {
  const ref = collection.doc(id);
  const doc = await ref.get();

  if (!doc.exists) {
    throw ApiError.notFound("Supplier not found");
  }

  if (data.name) {
    const duplicate = await collection
      .where("name", "==", data.name)
      .limit(1)
      .get();

    if (!duplicate.empty && duplicate.docs[0].id !== id) {
      throw ApiError.badRequest("Supplier already exists");
    }
  }

  await ref.update({
    ...data,
    updatedAt: Timestamp.now(),
  });

  const updated = await ref.get();

  return {
    id: updated.id,
    ...(updated.data() as Omit<Supplier, "id">),
  };
}

/**
 * Delete Supplier
 */
export async function deleteSupplier(id: string): Promise<void> {
  const ref = collection.doc(id);
  const doc = await ref.get();

  if (!doc.exists) {
    throw ApiError.notFound("Supplier not found");
  }

  await ref.delete();
}