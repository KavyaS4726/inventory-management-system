import { getFirestore } from "../config/firebase";
import { ApiError } from "../utils/ApiError";
import {
  CreateInventoryItemInput,
  InventoryItem,
  UpdateInventoryItemInput,
} from "../models/inventoryItem.model";

const COLLECTION = "inventoryItems";

function collection() {
  return getFirestore().collection(COLLECTION);
}

export async function createItem(data: CreateInventoryItemInput): Promise<InventoryItem> {
  const now = new Date();
  const docRef = await collection().add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  const snapshot = await docRef.get();
  return { id: snapshot.id, ...(snapshot.data() as Omit<InventoryItem, "id">) };
}

export async function getAllItems(): Promise<InventoryItem[]> {
  const snapshot = await collection().orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<InventoryItem, "id">) }));
}

export async function getItemById(id: string): Promise<InventoryItem> {
  const doc = await collection().doc(id).get();
  if (!doc.exists) {
    throw ApiError.notFound(`Inventory item with id "${id}" not found`);
  }
  return { id: doc.id, ...(doc.data() as Omit<InventoryItem, "id">) };
}

export async function updateItem(id: string, data: UpdateInventoryItemInput): Promise<InventoryItem> {
  const docRef = collection().doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw ApiError.notFound(`Inventory item with id "${id}" not found`);
  }
  await docRef.update({ ...data, updatedAt: new Date() });
  const updated = await docRef.get();
  return { id: updated.id, ...(updated.data() as Omit<InventoryItem, "id">) };
}

export async function deleteItem(id: string): Promise<void> {
  const docRef = collection().doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw ApiError.notFound(`Inventory item with id "${id}" not found`);
  }
  await docRef.delete();
}

export async function adjustStock(id: string, delta: number): Promise<InventoryItem> {
  const docRef = collection().doc(id);
  return getFirestore().runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    if (!doc.exists) {
      throw ApiError.notFound(`Inventory item with id "${id}" not found`);
    }
    const current = doc.data() as InventoryItem;
    const newQuantity = current.quantity + delta;
    if (newQuantity < 0) {
      throw ApiError.badRequest("Insufficient stock for this operation");
    }
    tx.update(docRef, { quantity: newQuantity, updatedAt: new Date() });
    return { id: doc.id, ...current, quantity: newQuantity };
  });
}
