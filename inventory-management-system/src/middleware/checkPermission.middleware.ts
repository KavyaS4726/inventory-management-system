import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { getPermissionsForUser } from "../services/role.service";
import { Module, Action } from "../models/permission.model";

/**
 * Checks whether the logged-in user's assigned role grants the given
 * action on the given module. Replaces the old hardcoded requireRole().
 *
 * Usage: checkPermission("products", "delete")
 */
export function checkPermission(module: Module, action: Action) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    try {
      const permissions = await getPermissionsForUser(req.user.uid);
      const modulePerms = permissions[module];

      if (!modulePerms || !modulePerms[action]) {
        return next(
          ApiError.forbidden(
            `You do not have permission to ${action} ${module}`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}