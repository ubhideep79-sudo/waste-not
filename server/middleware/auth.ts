import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "waste-not-super-secure-jwt-secret-key-bca-final-project-2026";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: "manager" | "staff";
    kitchenStation?: string;
  };
}

export function generateToken(payload: {
  userId: string;
  email: string;
  name: string;
  role: "manager" | "staff";
  kitchenStation?: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Missing or malformed token.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
      role: "manager" | "staff";
      kitchenStation?: string;
    };
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
        code: "SESSION_EXPIRED",
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }
}

export function requireManager(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (req.user.role !== "manager") {
    res.status(403).json({
      success: false,
      message:
        "Access denied. Manager privileges are required for this action.",
      code: "FORBIDDEN_ROLE",
    });
    return;
  }

  next();
}
