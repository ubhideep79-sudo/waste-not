import { Router, Response } from "express";
import { User } from "../models/User.ts";
import { requireAuth, requireManager, AuthRequest } from "../middleware/auth.ts";
import { AuditLog } from "../models/AuditLog.ts";

const router = Router();

// Protect all routes with auth + manager
router.use(requireAuth);
router.use(requireManager);

// List all users
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user list.",
      error: err.message,
    });
  }
});

// Create new staff account
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, kitchenStation, employeeId } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required fields.",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(400).json({
        success: false,
        message: "A user with this email address already exists.",
      });
      return;
    }

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === "manager" ? "manager" : "staff",
      kitchenStation: kitchenStation || "Main Kitchen",
      employeeId: employeeId || `WN-${Math.floor(1000 + Math.random() * 9000)}`,
      active: true,
    });

    await AuditLog.create({
      action: "STAFF_CREATED",
      entityType: "User",
      entityId: newUser._id.toString(),
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Manager",
      performedByRole: "manager",
      details: `Created new ${newUser.role} account for ${newUser.name} (${newUser.email}) assigned to ${newUser.kitchenStation}.`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Staff account created successfully for ${newUser.name}.`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        kitchenStation: newUser.kitchenStation,
        employeeId: newUser.employeeId,
        active: newUser.active,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create staff account.",
      error: err.message,
    });
  }
});

// Update user
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { name, kitchenStation, active, role, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    if (name) user.name = name.trim();
    if (kitchenStation) user.kitchenStation = kitchenStation.trim();
    if (typeof active === "boolean") user.active = active;
    if (role && (role === "manager" || role === "staff")) user.role = role;
    if (newPassword && newPassword.length >= 6) {
      user.password = newPassword; // Will trigger bcrypt pre-save hook
    }

    await user.save();

    await AuditLog.create({
      action: "STAFF_UPDATED",
      entityType: "User",
      entityId: user._id.toString(),
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Manager",
      performedByRole: "manager",
      details: `Updated details for staff member ${user.name} (Active: ${user.active}, Station: ${user.kitchenStation}).`,
    }).catch(() => {});

    res.json({
      success: true,
      message: "Staff member details updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        kitchenStation: user.kitchenStation,
        employeeId: user.employeeId,
        active: user.active,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update staff member.",
      error: err.message,
    });
  }
});

// Delete user
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    // Prevent self-deletion
    if (userToDelete._id.toString() === req.user?.userId) {
      res.status(400).json({
        success: false,
        message: "You cannot delete your own account while logged in.",
      });
      return;
    }

    await User.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: "STAFF_DELETED",
      entityType: "User",
      entityId: req.params.id,
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Manager",
      performedByRole: "manager",
      details: `Permanently removed staff account: ${userToDelete.name} (${userToDelete.email}).`,
    }).catch(() => {});

    res.json({
      success: true,
      message: `Staff account for ${userToDelete.name} was removed successfully.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete staff member.",
      error: err.message,
    });
  }
});

export default router;
