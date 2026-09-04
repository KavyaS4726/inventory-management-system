// src/services/order.service.ts

import { getFirestore } from "../config/firebase";
import { Order, OrderItem } from "../models/order.model";

const db = getFirestore();

const ordersCollection = db.collection("orders");
const productsCollection = db.collection("products");
const buyersCollection = db.collection("buyers");
const stockMovementsCollection = db.collection("stockMovements");

/**
 * Create a new order.
 *
 * - Validates buyer
 * - Validates products
 * - Checks stock
 * - Deducts stock
 * - Creates stock movement records
 * - Creates the order
 *
 * Everything related to stock/order creation happens
 * inside one Firestore transaction.
 */
export const createOrder = async (
  data: {
    buyerId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  },
  performedBy: {
    uid: string;
    email: string;
  }
) => {
  if (!data.buyerId) {
    throw new Error("Buyer is required");
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("At least one product is required");
  }

  // --------------------------------------------------
  // Check buyer
  // --------------------------------------------------

  const buyerDoc = await buyersCollection
    .doc(data.buyerId)
    .get();

  if (!buyerDoc.exists) {
    throw new Error("Buyer not found");
  }

  const buyer = buyerDoc.data() || {};

  const buyerName =
    typeof buyer.name === "string" && buyer.name.trim()
      ? buyer.name.trim()
      : "Unknown Buyer";

  // --------------------------------------------------
  // Transaction
  // --------------------------------------------------

  const result = await db.runTransaction(
    async (transaction: FirebaseFirestore.Transaction) => {
      const orderItems: OrderItem[] = [];

      let totalAmount = 0;

      // Create order reference first
      const orderRef = ordersCollection.doc();

      for (const item of data.items) {
        if (!item.productId) {
          throw new Error("Product is required");
        }

        if (
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0
        ) {
          throw new Error("Quantity must be greater than 0");
        }

        // ----------------------------------------------
        // Get product
        // ----------------------------------------------

        const productRef = productsCollection.doc(
          item.productId
        );

        const productDoc =
          await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(
            `Product not found: ${item.productId}`
          );
        }

        const product = productDoc.data() || {};

        const productName =
          typeof product.name === "string" &&
          product.name.trim()
            ? product.name.trim()
            : "Unknown Product";

        const currentStock = Number(
          product.quantity ?? 0
        );

        const unitPrice = Number(
          product.unitPrice ?? 0
        );

        // ----------------------------------------------
        // Check stock
        // ----------------------------------------------

        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${productName}. Available: ${currentStock}, Requested: ${item.quantity}`
          );
        }

        if (unitPrice < 0) {
          throw new Error(
            `Invalid price for ${productName}`
          );
        }

        // ----------------------------------------------
        // Calculate subtotal
        // ----------------------------------------------

        const subtotal =
          unitPrice * item.quantity;

        totalAmount += subtotal;

        // ----------------------------------------------
        // Add order item
        // ----------------------------------------------

        orderItems.push({
          productId: item.productId,
          productName,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });

        // ----------------------------------------------
        // Deduct stock
        // ----------------------------------------------

        transaction.update(productRef, {
          quantity:
            currentStock - item.quantity,
          updatedAt: new Date(),
        });

        // ----------------------------------------------
        // Create stock movement
        // ----------------------------------------------

        const movementRef =
          stockMovementsCollection.doc();

        transaction.set(movementRef, {
          productId: item.productId,

          type: "OUT",

          quantity: item.quantity,

          orderId: orderRef.id,

          buyerId: data.buyerId,

          buyerName,

          note: `Sale to ${buyerName}`,

          performedBy: {
            uid: performedBy.uid,
            email: performedBy.email,
          },

          createdAt: new Date(),
        });
      }

      // ------------------------------------------------
      // Create order
      // ------------------------------------------------

      const now = new Date();

      const orderData: Order = {
        buyerId: data.buyerId,

        buyerName,

        items: orderItems,

        totalAmount,

        status: "completed",

        createdAt: now as any,

        updatedAt: now as any,
      };

      transaction.set(orderRef, orderData);

      return {
        id: orderRef.id,
        ...orderData,
      };
    }
  );

  return result;
};

/**
 * Get all orders.
 *
 * Compatible with:
 *
 * getAllOrders(token)
 *
 * in the frontend API client.
 *
 * Optional buyerId filtering is supported.
 *
 * IMPORTANT:
 * Existing orders may not have buyerName saved inside
 * the order document. For those orders, we resolve the
 * buyer using buyerId and return the current buyer details.
 */
export const getAllOrders = async (
  query: {
    buyerId?: string;
  } = {}
) => {
  let ref: FirebaseFirestore.Query =
    ordersCollection;

  if (query.buyerId) {
    ref = ref.where(
      "buyerId",
      "==",
      query.buyerId
    );
  }

  const snapshot = await ref
    .orderBy("createdAt", "desc")
    .get();

  const orders = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const order = doc.data() as any;

      const buyerId = order.buyerId;

      let buyer: any = null;

      // ------------------------------------------------
      // Resolve buyer details
      // ------------------------------------------------

      if (buyerId) {
        const buyerDoc =
          await buyersCollection
            .doc(buyerId)
            .get();

        if (buyerDoc.exists) {
          buyer = buyerDoc.data() || {};
        }
      }

      // ------------------------------------------------
      // Return order + buyer details
      // ------------------------------------------------

      return {
        id: doc.id,

        // Keep every existing order field.
        ...order,

        // For old orders where buyerName is missing,
        // get the current name from the buyer document.
        buyerName:
          order.buyerName ??
          (typeof buyer?.name === "string"
            ? buyer.name
            : "Unknown Buyer"),

        // Current buyer contact information.
        buyerEmail:
          typeof buyer?.email === "string"
            ? buyer.email
            : "",

        buyerPhone:
          typeof buyer?.phone === "string"
            ? buyer.phone
            : "",

        buyerAddress:
          typeof buyer?.address === "string"
            ? buyer.address
            : "",
      };
    })
  );

  return orders;
};

/**
 * Get one order by ID.
 */
export const getOrderById = async (
  id: string
) => {
  if (!id) {
    throw new Error("Order ID is required");
  }

  const doc = await ordersCollection
    .doc(id)
    .get();

  if (!doc.exists) {
    throw new Error("Order not found");
  }

  const order = doc.data() as any;

  // --------------------------------------------------
  // Resolve buyer details
  // --------------------------------------------------

  let buyer: any = null;

  if (order.buyerId) {
    const buyerDoc =
      await buyersCollection
        .doc(order.buyerId)
        .get();

    if (buyerDoc.exists) {
      buyer = buyerDoc.data() || {};
    }
  }

  return {
    id: doc.id,

    ...order,

    buyerName:
      order.buyerName ??
      (typeof buyer?.name === "string"
        ? buyer.name
        : "Unknown Buyer"),

    buyerEmail:
      typeof buyer?.email === "string"
        ? buyer.email
        : "",

    buyerPhone:
      typeof buyer?.phone === "string"
        ? buyer.phone
        : "",

    buyerAddress:
      typeof buyer?.address === "string"
        ? buyer.address
        : "",
  };
};

/**
 * Get all orders belonging to one buyer.
 */
export const getBuyerOrderSummary = async (
  buyerId: string
) => {
  if (!buyerId) {
    throw new Error("Buyer ID is required");
  }

  // --------------------------------------------------
  // Get buyer
  // --------------------------------------------------

  const buyerDoc = await buyersCollection
    .doc(buyerId)
    .get();

  if (!buyerDoc.exists) {
    throw new Error("Buyer not found");
  }

  const buyer = buyerDoc.data() || {};

  // --------------------------------------------------
  // Get buyer orders
  // --------------------------------------------------

  const ordersSnapshot =
    await ordersCollection
      .where("buyerId", "==", buyerId)
      .orderBy("createdAt", "desc")
      .get();

  const orders =
    ordersSnapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

  // --------------------------------------------------
  // Calculate total
  // --------------------------------------------------

  const totalSpent = orders.reduce(
    (sum: number, order: any) =>
      sum +
      Number(order.totalAmount ?? 0),
    0
  );

  return {
    id: buyerDoc.id,

    name: buyer.name,

    email: buyer.email,

    address: buyer.address,

    phone: buyer.phone,

    totalOrders: orders.length,

    totalSpent,

    orders,
  };
};