import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import * as authService from "../services/auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    data: profile,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    data: tokens,
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const profile = await authService.getUserProfile(req.user.uid);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const profile = await authService.updateOwnProfile(
    req.user.uid,
    {
      name: req.body.name,
    }
  );

  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
      req.user.uid,
      req.user.email,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  }
);

export const loginWithGoogle = asyncHandler(
  async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      throw ApiError.badRequest("Google ID token is required");
    }

    const profile = await authService.loginWithGoogle(idToken);

    res.status(200).json({
      success: true,
      data: profile,
    });
  }
);