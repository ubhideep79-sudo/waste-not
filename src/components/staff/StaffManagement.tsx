import React, { useState, useEffect } from "react";
import { User, UserRole } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import { Modal } from "../common/Modal.tsx";
import { ConfirmDialog } from "../common/ConfirmDialog.tsx";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ChefHat,
  Trash2,
  KeyRound,
  Check,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";

const STATIONS = [
  "Main Kitchen",
  "Banquet Kitchen",
  "Bakery & Pastry",
  "Butchery",
  "Cold Prep / Garde Manger",
  "Room Service",
  "All Stations (Executive)",
];

export const StaffManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Create Staff Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<UserRole>("staff");
  const [kitchenStation, setKitchenStation] = useState<string>("Main Kitchen");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Password reset modal
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");

  // Delete user
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err: any) {
      toast.error("Failed to load staff list: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Name, email, and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createUser({
        name,
        email,
        password,
        role,
        kitchenStation,
        employeeId,
      });
      toast.success(`Account for ${name} (${role}) created successfully.`);
      setIsCreateModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const updatedActive = !user.active;
      await api.updateUser(user.id, { active: updatedActive });
      toast.success(
        `Staff member ${user.name} is now ${updatedActive ? "Active" : "Deactivated"}.`
      );
      loadUsers();
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      await api.updateUser(resettingUser.id, { newPassword });
      toast.success(`Password reset for ${resettingUser.name}.`);
      setResettingUser(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await api.deleteUser(deletingUser.id);
      toast.success(`User ${deletingUser.name} deleted.`);
      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.kitchenStation.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#12372A] font-display">
            Kitchen Staff & Access Management
          </h1>
          <p className="text-xs text-[#52796F]">
            Authorized kitchen personnel accounts, role-based security & station assignments
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#F2C94C]" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#D5DDD8] shadow-card">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, station, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#D5DDD8] pl-8 pr-3 py-2 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-[#D5DDD8] shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading kitchen team records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#D5DDD8] text-[11px] font-semibold uppercase tracking-wider text-[#52796F]">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Kitchen Station</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFE9]">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#12372A]">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {u.email}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            u.role === "manager"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {u.role === "manager" ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ChefHat className="w-3.5 h-3.5 text-slate-600" />
                          )}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {u.kitchenStation}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                        {u.employeeId}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => !isSelf && handleToggleActive(u)}
                          disabled={isSelf}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                            u.active !== false
                              ? "bg-[#D8F3DC] text-[#1E4D3A] hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          } ${isSelf ? "cursor-default opacity-80" : "cursor-pointer"}`}
                        >
                          {u.active !== false ? (
                            <CheckCircle className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span>{u.active !== false ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => {
                            setResettingUser(u);
                            setNewPassword("");
                          }}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {!isSelf && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Kitchen Staff Account"
        subtitle="Provision hotel credentials for chefs, prep cooks, and banquet supervisors"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Full Name & Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Demi Chef Sunita Rao"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. sunita.rao@wastenot.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                Access Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
              >
                <option value="staff">Staff (Kitchen Team)</option>
                <option value="manager">Manager (Executive Chef)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                Employee Badge ID
              </label>
              <input
                type="text"
                placeholder="e.g. WN-CK05"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Assigned Kitchen Station <span className="text-red-500">*</span>
            </label>
            <select
              value={kitchenStation}
              onChange={(e) => setKitchenStation(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            >
              {STATIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-[#74C69D]" />
              )}
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      {resettingUser && (
        <Modal
          isOpen={!!resettingUser}
          onClose={() => setResettingUser(null)}
          title={`Reset Password: ${resettingUser.name}`}
          subtitle="Update staff login credentials"
          maxWidth="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                New Password (minimum 6 chars) <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password..."
                className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors"
              >
                Save New Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirm */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete Kitchen Staff Account"
        message={`Are you sure you want to permanently remove the account for ${deletingUser?.name} (${deletingUser?.email})?`}
        confirmLabel="Delete Account"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
