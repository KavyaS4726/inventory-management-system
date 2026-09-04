
import { getFirestore } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Product } from "../models/product.model";
import { ApiError } from "../utils/ApiError";
import { applyListQuery, ListQuery } from "../utils/queryHelper";

const db = getFirestore();
const collection = db.collection("products");
const categoryCollection = db.collection("categories");
const supplierCollection = db.collection("suppliers");

interface ProductResponse extends Product {
  price: number;
  categoryName?: string;
}

async function generateSku(categoryId: string): Promise<string> {
  const categoryDoc = await categoryCollection.doc(categoryId).get();

  const categoryName = (categoryDoc.data()?.name || "PROD") as string;

  const prefix =
    categoryName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() ||
    "PROD";

  const existing = await collection
    .where("categoryId", "==", categoryId)
    .get();

  let counter = existing.size + 1;

  let sku = `${prefix}-${String(counter).padStart(3, "0")}`;

  while (true) {
    const clash = await collection
      .where("sku", "==", sku)
      .limit(1)
      .get();

    if (clash.empty) break;

    counter++;

    sku = `${prefix}-${String(counter).padStart(3, "0")}`;
  }

  return sku;
}

/**
 * Convert the database Product structure into the structure
 * expected by the frontend.
 *
 * Database:
 *   unitPrice
 *   categoryId
 *
 * Frontend:
 *   price
 *   categoryName
 */
async function toProductResponse(
  id: string,
  data: Omit<Product, "id">
): Promise<ProductResponse> {
  let categoryName: string | undefined;

  if (data.categoryId) {
    const categoryDoc = await categoryCollection
      .doc(data.categoryId)
      .get();

    if (categoryDoc.exists) {
      categoryName = categoryDoc.data()?.name as string | undefined;
    }
  }

  return {
    id,
    ...data,

    // Frontend expects "price"
    price: data.unitPrice,

    // Frontend expects "categoryName"
    categoryName,
  };
}

/**
 * Create Product
 */
export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt" | "sku">
): Promise<ProductResponse> {
  const categoryDoc = await categoryCollection
    .doc(data.categoryId)
    .get();

  if (!categoryDoc.exists) {
    throw ApiError.badRequest(
      "Invalid categoryId - category does not exist"
    );
  }

  const supplierDoc = await supplierCollection
    .doc(data.supplierId)
    .get();

  if (!supplierDoc.exists) {
    throw ApiError.badRequest(
      "Invalid supplierId - supplier does not exist"
    );
  }

  if (
    data.quantity < 0 ||
    data.unitPrice < 0 ||
    data.reorderThreshold < 0
  ) {
    throw ApiError.badRequest(
      "quantity, unitPrice, and reorderThreshold must be non-negative"
    );
  }

  const sku = await generateSku(data.categoryId);

  const product = {
    ...data,
    sku,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await collection.add(product);

  return toProductResponse(
    docRef.id,
    product
  );
}

/**
 * Get All Products
 */
export async function getAllProducts(
  query: ListQuery & {
    categoryId?: string;
    supplierId?: string;
    lowStock?: string;
  }
) {
  let fsQuery: FirebaseFirestore.Query = collection;

  if (query.categoryId) {
    fsQuery = fsQuery.where(
      "categoryId",
      "==",
      query.categoryId
    );
  }

  if (query.supplierId) {
    fsQuery = fsQuery.where(
      "supplierId",
      "==",
      query.supplierId
    );
  }

  const snapshot = await fsQuery.get();

  const products = await Promise.all(
    snapshot.docs.map((doc) =>
      toProductResponse(
        doc.id,
        doc.data() as Omit<Product, "id">
      )
    )
  );

  let filteredProducts = products;

  if (query.lowStock === "true") {
    filteredProducts = products.filter(
      (p) => p.quantity <= p.reorderThreshold
    );
  }

  return applyListQuery(
    filteredProducts,
    query,
    {
      searchableFields: [
        "name",
        "sku",
        "categoryName",
      ],
      filterableFields: [],
      defaultSortBy: "name",
      defaultLimit: 10,
    }
  );
}

/**
 * Get Product By Id
 */
export async function getProductById(
  id: string
): Promise<ProductResponse> {
  const doc = await collection.doc(id).get();

  if (!doc.exists) {
    throw ApiError.notFound("Product not found");
  }

  return toProductResponse(
    doc.id,
    doc.data() as Omit<Product, "id">
  );
}

/**
 * Update Product
 */
export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<ProductResponse> {
  const ref = collection.doc(id);

  const doc = await ref.get();

  if (!doc.exists) {
    throw ApiError.notFound("Product not found");
  }

  if (data.sku) {
    const duplicate = await collection
      .where("sku", "==", data.sku)
      .limit(1)
      .get();

    if (
      !duplicate.empty &&
      duplicate.docs[0].id !== id
    ) {
      throw ApiError.badRequest(
        "Product with this SKU already exists"
      );
    }
  }

  if (data.categoryId) {
    const categoryDoc = await categoryCollection
      .doc(data.categoryId)
      .get();

    if (!categoryDoc.exists) {
      throw ApiError.badRequest(
        "Invalid categoryId - category does not exist"
      );
    }
  }

  if (data.supplierId) {
    const supplierDoc = await supplierCollection
      .doc(data.supplierId)
      .get();

    if (!supplierDoc.exists) {
      throw ApiError.badRequest(
        "Invalid supplierId - supplier does not exist"
      );
    }
  }

  await ref.update({
    ...data,
    updatedAt: Timestamp.now(),
  });

  const updated = await ref.get();

  return toProductResponse(
    updated.id,
    updated.data() as Omit<Product, "id">
  );
}

/**
 * Delete Product
 */
export async function deleteProduct(
  id: string
): Promise<void> {
  const ref = collection.doc(id);

  const doc = await ref.get();

  if (!doc.exists) {
    throw ApiError.notFound("Product not found");
  }

  await ref.delete();
}

