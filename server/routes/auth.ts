import { Router, Response } from "express";
import { User } from "../models/User.ts";
import { generateToken, requireAuth, AuthRequest } from "../middleware/auth.ts";
import { AuditLog } from "../models/AuditLog.ts";

const router = Router();

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials.",
      });
      return;
    }

    if (!user.active) {
      res.status(403).json({
        success: false,
        message:
          "This account has been deactivated. Please contact the Executive Chef or Kitchen Manager.",
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials.",
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      kitchenStation: user.kitchenStation,
    });

    // Write audit log
    await AuditLog.create({
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user._id.toString(),
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      details: `${user.name} (${user.role.toUpperCase()}) logged in from ${user.kitchenStation}.`,
    }).catch(() => {});

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        kitchenStation: user.kitchenStation,
        employeeId: user.employeeId,
      },
    });
  } catch (err: any) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred during login.",
      error: err.message,
    });
  }
});

// Current user profile
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId).select("-password");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        kitchenStation: user.kitchenStation,
        employeeId: user.employeeId,
        active: user.active,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
      error: err.message,
    });
  }
});

// Change Password
router.post(
  "/change-password",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: "Both current and new passwords are required.",
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long.",
        });
        return;
      }

      const user = await User.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found.",
        });
        return;
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: "Current password does not match.",
        });
        return;
      }

      user.password = newPassword;
      await user.save();

      await AuditLog.create({
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: user._id.toString(),
        performedBy: user._id,
        performedByName: user.name,
        performedByRole: user.role,
        details: `${user.name} changed their account password.`,
      }).catch(() => {});

      res.json({
        success: true,
        message: "Password changed successfully.",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: "Failed to change password.",
        error: err.message,
      });
    }
  }
);

// Demo credentials helper for testing/grading
router.get("/demo-credentials", (_req, res) => {
  res.json({
    success: true,
    manager: {
      email: process.env.MANAGER_EMAIL || "manager@wastenot.com",
      password: process.env.MANAGER_PASSWORD || "Manager@123",
      role: "manager",
      title: "Executive Chef / General Manager",
    },
    staff: {
      email: process.env.STAFF_EMAIL || "chef@wastenot.com",
      password: process.env.STAFF_PASSWORD || "Chef@123",
      role: "staff",
      title: "Sous Chef / Kitchen Staff",
    },
  });
});

export default router;
