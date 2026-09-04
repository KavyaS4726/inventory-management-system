declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        roleId: string | null;
        role: string | null;
      };
    }
  }
}

export {};