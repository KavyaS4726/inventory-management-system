import { getFirestore } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Buyer } from "../models/buyer.model";
import { ApiError } from "../utils/ApiError";
import { applyListQuery, ListQuery } from "../utils/queryHelper";

const db = getFirestore();
const collection = db.collection("buyers");

export async function createBuyer(
  data: Omit<Buyer, "id" | "createdAt" | "updatedAt">
): Promise<Buyer> {
  const buyer = {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await collection.add(buyer);

  return {
    id: docRef.id,
    ...buyer,
  };
}

export async function getAllBuyers(query: ListQuery) {
  const snapshot = await collection.get();

  const buyers = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Buyer, "id">),
  }));

  return applyListQuery(buyers, query, {
    searchableFields: ["name", "email", "phone"],
    filterableFields: [],
    defaultSortBy: "name",
    defaultLimit: 10,
  });
}

export async function getBuyerById(id: string): Promise<Buyer> {
  const doc = await collection.doc(id).get();

  if (!doc.exists) {
    throw ApiError.notFound("Buyer not found");
  }

  return {
    id: doc.id,
    ...(doc.data() as Omit<Buyer, "id">),
  };
}

export async function updateBuyer(
  id: string,
  data: Partial<Buyer>
): Promise<Buyer> {
  const ref = collection.doc(id);
  const doc = await ref.get();

  if (!doc.exists) {
    throw ApiError.notFound("Buyer not found");
  }

  await ref.update({
    ...data,
    updatedAt: Timestamp.now(),
  });

  const updated = await ref.get();

  return {
    id: updated.id,
    ...(updated.data() as Omit<Buyer, "id">),
  };
}

export async function deleteBuyer(id: string): Promise<void> {
  const ref = collection.doc(id);
  const doc = await ref.get();

  if (!doc.exists) {
    throw ApiError.notFound("Buyer not found");
  }

  await ref.delete();
}