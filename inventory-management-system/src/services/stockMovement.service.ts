import { getFirestore } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { StockMovement } from "../models/stockMovement.model";
import { ApiError } from "../utils/ApiError";
import { applyListQuery, ListQuery } from "../utils/queryHelper";

const db = getFirestore();
const movementCollection = db.collection("stockMovements");
const productCollection = db.collection("products");
const categoryCollection = db.collection("categories");

/**
 * Record Stock In (restock) — requires a supplier and unit price so the
 * delivery can be traced back to who supplied it and what it cost.
 */
export async function recordStockIn(
  productId: string,
  quantity: number,
  note: string | undefined,
  performedBy: { uid: string; email: string },
  supplierId: string,
  unitPrice: number
): Promise<StockMovement> {
  if (quantity <= 0) {
    throw ApiError.badRequest("Quantity must be greater than 0");
  }
  if (!supplierId) {
    throw ApiError.badRequest("supplierId is required for stock in");
  }
  if (unitPrice === undefined || unitPrice < 0) {
    throw ApiError.badRequest("unitPrice is required for stock in");
  }

  const productRef = productCollection.doc(productId);

  const result = await db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);

    if (!productDoc.exists) {
      throw ApiError.notFound("Product not found");
    }

    const productData = productDoc.data();
    const currentQuantity = productData?.quantity ?? 0;
    const newQuantity = currentQuantity + quantity;

    transaction.update(productRef, {
      quantity: newQuantity,
      updatedAt: Timestamp.now(),
    });

    const movementRef = movementCollection.doc();
    const totalPrice = Math.round(unitPrice * quantity * 100) / 100;

    const movement: StockMovement = {
      productId,
      type: "IN",
      quantity,
      note,
      performedBy,
      createdAt: Timestamp.now(),
      supplierId,
      categoryId: productData?.categoryId ?? null,
      unitPrice,
      totalPrice,
    };

    transaction.set(movementRef, movement);

    return { id: movementRef.id, ...movement };
  });

  return result;
}

/**
 * Record Stock Out (dispatch/sale/usage) — unchanged, no supplier involved.
 */
export async function recordStockOut(
  productId: string,
  quantity: number,
  note: string | undefined,
  performedBy: { uid: string; email: string }
): Promise<StockMovement> {
  if (quantity <= 0) {
    throw ApiError.badRequest("Quantity must be greater than 0");
  }

  const productRef = productCollection.doc(productId);

  const result = await db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);

    if (!productDoc.exists) {
      throw ApiError.notFound("Product not found");
    }

    const currentQuantity = productDoc.data()?.quantity ?? 0;

    if (currentQuantity < quantity) {
      throw ApiError.badRequest(
        `Insufficient stock. Available: ${currentQuantity}, Requested: ${quantity}`
      );
    }

    const newQuantity = currentQuantity - quantity;

    transaction.update(productRef, {
      quantity: newQuantity,
      updatedAt: Timestamp.now(),
    });

    const movementRef = movementCollection.doc();
    const movement: StockMovement = {
      productId,
      type: "OUT",
      quantity,
      note,
      performedBy,
      createdAt: Timestamp.now(),
    };

    transaction.set(movementRef, movement);

    return { id: movementRef.id, ...movement };
  });

  return result;
}

/**
 * Get Stock History for a Product
 */
export async function getStockHistory(productId: string, query: ListQuery) {
  const productDoc = await productCollection.doc(productId).get();

  if (!productDoc.exists) {
    throw ApiError.notFound("Product not found");
  }

  const snapshot = await movementCollection.where("productId", "==", productId).get();

  const movements = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<StockMovement, "id">),
  }));

  return applyListQuery(movements, query, {
    searchableFields: ["note"],
    filterableFields: ["type"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
  });
}

export const getAllMovements = async () => {
  const snapshot = await db
    .collection("stockMovements")
    .orderBy("createdAt", "desc")
    .limit(100) // cap it so this stays fast as data grows
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get Stock-In History for a Supplier — powers the "what has this supplier
 * delivered" view on the Suppliers page.
 */
export async function getSupplierStockHistory(supplierId: string) {
  const snapshot = await movementCollection
    .where("supplierId", "==", supplierId)
    .where("type", "==", "IN")
    .orderBy("createdAt", "desc")
    .get();

  const rawMovements = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<StockMovement, "id">),
  }));

  // Look up product and category names to enrich each movement (IDs alone
  // aren't useful to display on the Suppliers page).
  const productIds = [...new Set(rawMovements.map((m) => m.productId))];
  const categoryIds = [...new Set(rawMovements.map((m) => m.categoryId).filter(Boolean))] as string[];

  const productDocs = await Promise.all(productIds.map((id) => productCollection.doc(id).get()));
  const productMap = new Map(productDocs.map((d) => [d.id, d.data()?.name || "Unknown product"]));

  const categoryDocs = await Promise.all(categoryIds.map((id) => categoryCollection.doc(id).get()));
  const categoryMap = new Map(categoryDocs.map((d) => [d.id, d.data()?.name || "Uncategorized"]));

  const movements = rawMovements.map((m) => ({
    ...m,
    productName: productMap.get(m.productId) || "Unknown product",
    categoryName: m.categoryId ? categoryMap.get(m.categoryId) || "Uncategorized" : "Uncategorized",
  }));

  const totalSpent = movements.reduce((sum, m) => sum + (m.totalPrice || 0), 0);
  const totalQuantity = movements.reduce((sum, m) => sum + (m.quantity || 0), 0);

  // Group by calendar date so the UI can show a per-day subtotal.
  const dayMap = new Map<string, { date: string; movements: typeof movements; dayTotal: number }>();
  for (const m of movements) {
    const dateKey = m.createdAt.toDate().toISOString().slice(0, 10); // YYYY-MM-DD
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { date: dateKey, movements: [], dayTotal: 0 });
    }
    const group = dayMap.get(dateKey)!;
    group.movements.push(m);
    group.dayTotal += m.totalPrice || 0;
  }
  const byDate = Array.from(dayMap.values()).sort((a, b) => (a.date < b.date ? 1 : -1));

  return { movements, byDate, totalSpent, totalQuantity };
}