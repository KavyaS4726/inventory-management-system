import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import * as userService from "../services/user.service";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getAllUsers(req.query as any);
  res.status(200).json({ success: true, ...result });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.uid === req.params.id) {
    throw ApiError.badRequest("You cannot modify your own account from here. Use your Profile page instead.");
  }
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.uid === req.params.id) {
    throw ApiError.badRequest("You cannot delete your own account.");
  }
  await userService.deleteUser(req.params.id);
  res.status(200).json({ success: true, message: "User deleted successfully" });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
});