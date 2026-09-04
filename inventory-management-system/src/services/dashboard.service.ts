import { getFirestore } from "../config/firebase";
import { Product } from "../models/product.model";
import { StockMovement } from "../models/stockMovement.model";

const db = getFirestore();
const productCollection = db.collection("products");
const categoryCollection = db.collection("categories");
const movementCollection = db.collection("stockMovements");

export async function getDashboardSummary() {
  // Fetch all products once, reuse for multiple calculations
  const productsSnapshot = await productCollection.get();
  const products = productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, "id">),
  }));

  // 1. Total number of products
  const totalProducts = products.length;

  // 2. Total stock value (sum of quantity * unitPrice)
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0
  );

  // 3. Low-stock items (quantity <= reorderThreshold)
  const lowStockItems = products
    .filter((p) => p.quantity <= p.reorderThreshold)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      quantity: p.quantity,
      reorderThreshold: p.reorderThreshold,
    }));

  // 4. Recent stock movements (latest 10, across all products)
  const recentMovementsSnapshot = await movementCollection
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const recentMovements = recentMovementsSnapshot.docs.map((doc) => {
  const data = doc.data() as Omit<StockMovement, "id">;

  return {
    id: doc.id,
    ...data,
    performedBy: data.performedBy
      ? {
          uid: data.performedBy.uid || "",
          email: data.performedBy.email || "System",
        }
      : {
          uid: "",
          email: "System",
        },
  };
});

  // 5. Products by category (count)
  const categoriesSnapshot = await categoryCollection.get();
  const categoryMap: Record<string, string> = {};
  categoriesSnapshot.docs.forEach((doc) => {
    categoryMap[doc.id] = doc.data().name;
  });

  const productsByCategory: Record<string, number> = {};
  products.forEach((p) => {
    const categoryName = categoryMap[p.categoryId] || "Unknown";
    productsByCategory[categoryName] = (productsByCategory[categoryName] || 0) + 1;
  });

  return {
    totalProducts,
    totalStockValue,
    lowStockItems,
    recentMovements,
    productsByCategory,
  };
}