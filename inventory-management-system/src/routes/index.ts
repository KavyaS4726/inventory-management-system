import { Router } from "express";
import inventoryRoutes from "./inventory.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import categoryRoutes from "./category.routes";
import supplierRoutes from "./supplier.routes";
import productRoutes from "./product.routes";
import stockMovementRoutes from "./stockMovement.routes";
import dashboardRoutes from "./dashboard.routes";
import buyerRoutes from "./buyer.routes";
import orderRoutes from "./order.routes";
import roleRoutes from "./role.routes";
import permissionRoutes from "./permission.routes";


const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is healthy" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/categories", categoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/products", productRoutes);
router.use("/stock-movements", stockMovementRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/buyers", buyerRoutes);
router.use("/orders", orderRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);

export default router;