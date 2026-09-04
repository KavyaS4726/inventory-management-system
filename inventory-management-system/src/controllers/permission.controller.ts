import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as permissionService from "../services/permission.service";

export const getAllPermissionsHandler =
  asyncHandler(
    async (_req: Request, res: Response) => {
      const permissions =
        await permissionService.getAllPermissions();

      res.status(200).json({
        success: true,
        data: permissions,
      });
    }
  );

export const getPermissionByIdHandler =
  asyncHandler(
    async (req: Request, res: Response) => {
      const permission =
        await permissionService.getPermissionById(
          req.params.id
        );

      if (!permission) {
        res.status(404).json({
          success: false,
          message: `Permission with id "${req.params.id}" not found`,
        });

        return;
      }

      res.status(200).json({
        success: true,
        data: permission,
      });
    }
  );