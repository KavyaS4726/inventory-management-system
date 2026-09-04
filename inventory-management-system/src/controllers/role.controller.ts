import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as roleService from "../services/role.service";

export const getAllRolesHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const roles = await roleService.getAllRoles();

    res.status(200).json({
      success: true,
      data: roles,
    });
  }
);

export const getRoleByIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const role = await roleService.getRoleById(req.params.id);

    res.status(200).json({
      success: true,
      data: role,
    });
  }
);

export const createRoleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const role = await roleService.createRole(req.body);

    res.status(201).json({
      success: true,
      data: role,
    });
  }
);

export const updateRoleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const role = await roleService.updateRole(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: role,
    });
  }
);

export const deleteRoleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await roleService.deleteRole(req.params.id);

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  }
);