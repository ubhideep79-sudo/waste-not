import React, { useState, useEffect, useCallback } from "react";
import { WasteRecord, WasteReason } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import { RecordWasteModal } from "./RecordWasteModal.tsx";
import { ConfirmDialog } from "../common/ConfirmDialog.tsx";
import {
  Search,
  Filter,
  PlusCircle,
  Calendar,
  RotateCcw,
  Edit2,
  Trash2,
  Download,
  Info,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const REASONS: (WasteReason | "All")[] = [
  "All",
  "Spoilage",
  "Overproduction",
  "Preparation waste",
  "Expired ingredients",
  "Storage errors",
  "Plate waste",
  "Other",
];

const STATIONS = [
  "All",
  "Main Kitchen",
  "Banquet Kitchen",
  "Bakery & Pastry",
  "Butchery",
  "Cold Prep / Garde Manger",
  "Room Service",
];

export const WasteLogList: React.FC = () => {
  const { isManager, user } = useAuth();
  const toast = useToast();

  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalCostINR: number;
    totalWeightKg: number;
    recordCount: number;
  }>({ totalCostINR: 0, totalWeightKg: 0, recordCount: 0 });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState<string>("All");
  const [selectedStation, setSelectedStation] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [myEntriesOnly, setMyEntriesOnly] = useState<boolean>(!isManager);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<WasteRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [viewDetailsRecord, setViewDetailsRecord] = useState<WasteRecord | null>(
    null
  );

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getWasteRecords({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        reason: selectedReason !== "All" ? selectedReason : undefined,
        kitchenStation: selectedStation !== "All" ? selectedStation : undefined,
        myEntriesOnly: myEntriesOnly,
        page,
        limit: 25,
      });

      // Filter locally for search term
      let filtered = res.records;
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        filtered = filtered.filter(
          (r) =>
            r.ingredientName.toLowerCase().includes(query) ||
            r.category.toLowerCase().includes(query) ||
            r.recordedByName.toLowerCase().includes(query) ||
            (r.notes && r.notes.toLowerCase().includes(query))
        );
      }

      setRecords(filtered);
      setSummary(res.summary);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast.error("Failed to load waste records: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    startDate,
    endDate,
    selectedReason,
    selectedStation,
    myEntriesOnly,
    search,
  ]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedReason("All");
    setSelectedStation("All");
    setStartDate("");
    setEndDate("");
    setMyEntriesOnly(false);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await api.deleteWasteRecord(deletingRecord._id);
      toast.success(
        `Waste entry for ${deletingRecord.ingredientName} was deleted.`
      );
      setDeletingRecord(null);
      loadRecords();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete waste record.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#12372A] font-display">
            Kitchen Food Waste Log
          </h1>
          <p className="text-xs text-[#52796F]">
            Audit history of discarded ingredients with snapshot cost & shift details
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManager && (
            <button
              onClick={() =>
                api.downloadCsv({
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  reason: selectedReason !== "All" ? selectedReason : undefined,
                  kitchenStation:
                    selectedStation !== "All" ? selectedStation : undefined,
                })
              }
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#12372A] bg-white border border-[#D5DDD8] rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingRecord(null);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#F2C94C]" />
            <span>Record Food Waste</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="p-4 rounded-xl bg-white border border-[#D5DDD8] shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search ingredient, chef..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] pl-8 pr-3 py-2 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Reason */}
          <div>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white px-2.5 py-2 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            >
              <option value="All">All Reasons</option>
              {REASONS.filter((r) => r !== "All").map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Station */}
          <div>
            <select
              value={selectedStation}
              onChange={(e) => {
                setSelectedStation(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white px-2.5 py-2 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            >
              <option value="All">All Stations</option>
              {STATIONS.filter((s) => s !== "All").map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] pl-8 pr-2 py-2 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* End Date */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] pl-8 pr-2 py-2 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filter Footer: Toggle My Entries + Active Filter Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#162920]">
              <input
                type="checkbox"
                checked={myEntriesOnly}
                onChange={(e) => {
                  setMyEntriesOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-300 text-[#2D6A4F] focus:ring-[#2D6A4F]"
              />
              <span>Show entries recorded by me only</span>
            </label>

            {(startDate ||
              endDate ||
              selectedReason !== "All" ||
              selectedStation !== "All" ||
              search) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] text-[#52796F] hover:text-[#12372A] font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* View Summary */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-500">
              Showing: <strong className="text-slate-900">{records.length}</strong>{" "}
              records
            </span>
            <span className="text-slate-500">
              Filtered Wt:{" "}
              <strong className="text-[#12372A]">{summary.totalWeightKg} kg</strong>
            </span>
            <span className="text-slate-500">
              Filtered Loss:{" "}
              <strong className="text-[#12372A]">
                ₹{summary.totalCostINR.toLocaleString("en-IN")}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-[#D5DDD8] shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
            <p>Loading waste records from database...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Info className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No waste records found</p>
            <p className="text-[11px] text-slate-400">
              Try adjusting your filter criteria or click "Record Food Waste" to log a new entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#D5DDD8] text-[11px] font-semibold uppercase tracking-wider text-[#52796F]">
                  <th className="py-3 px-4">Date & Shift</th>
                  <th className="py-3 px-4">Ingredient & Category</th>
                  <th className="py-3 px-4">Quantity Wasted</th>
                  <th className="py-3 px-4">Unit Price (INR)</th>
                  <th className="py-3 px-4">Total Loss (INR)</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFE9]">
                {records.map((r) => {
                  const recordDateObj = new Date(r.recordDate);
                  const isOwner = r.recordedBy === user?.id;
                  const canEdit = isManager || isOwner;

                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-[#F3FAF5]/60 transition-colors"
                    >
                      {/* Date & Shift */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-[#162920]">
                          {recordDateObj.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {r.shift.split(" ")[0]} Shift
                        </div>
                      </td>

                      {/* Ingredient & Category */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#12372A]">
                          {r.ingredientName}
                        </div>
                        <div className="text-[11px] text-[#52796F]">
                          {r.category}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-medium text-slate-800">
                        {r.quantity} {r.unit}
                        {r.unit !== "kg" && (
                          <span className="block text-[10px] text-slate-400">
                            ≈ {r.normalizedKg} kg
                          </span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                        ₹{r.costPerUnit} / {r.unit}
                      </td>

                      {/* Total Cost */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-[#12372A]">
                        ₹{r.totalCost.toLocaleString("en-IN")}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs text-slate-700 font-medium">
                          {r.reason}
                        </span>
                      </td>

                      {/* Station */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {r.kitchenStation}
                      </td>

                      {/* Recorded By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800">
                          {r.recordedByName}
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase">
                          {r.recordedByRole}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => setViewDetailsRecord(r)}
                          className="p-1 text-slate-500 hover:text-[#12372A] hover:bg-slate-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingRecord(r);
                              setIsRecordModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isManager && (
                          <button
                            onClick={() => setDeletingRecord(r)}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete Record (Manager)"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#D5DDD8] bg-[#FAF9F5] flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Waste Modal */}
      <RecordWasteModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={loadRecords}
        initialData={editingRecord}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDelete}
        title="Delete Food Waste Entry"
        message={`Are you sure you want to permanently delete the waste entry for "${deletingRecord?.ingredientName}" (${deletingRecord?.quantity} ${deletingRecord?.unit}, ₹${deletingRecord?.totalCost})? This action will be recorded in the security audit trail.`}
        confirmLabel="Delete Entry"
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* View Details Modal */}
      {viewDetailsRecord && (
        <ConfirmDialog
          isOpen={!!viewDetailsRecord}
          onClose={() => setViewDetailsRecord(null)}
          onConfirm={() => setViewDetailsRecord(null)}
          title={`Waste Record Details: ${viewDetailsRecord.ingredientName}`}
          message={`Quantity: ${viewDetailsRecord.quantity} ${viewDetailsRecord.unit} (Normalized: ${viewDetailsRecord.normalizedKg} kg) | Cost: ₹${viewDetailsRecord.totalCost} | Reason: ${viewDetailsRecord.reason} | Station: ${viewDetailsRecord.kitchenStation} | Shift: ${viewDetailsRecord.shift} | Recorded By: ${viewDetailsRecord.recordedByName} (${viewDetailsRecord.recordedByRole}) | Date: ${new Date(viewDetailsRecord.recordDate).toLocaleString()} | Notes: ${viewDetailsRecord.notes || "None provided."} | Stock Deducted: ${viewDetailsRecord.deductedFromStock ? "Yes" : "No"}`}
          confirmLabel="Close"
          cancelLabel="Done"
          isDestructive={false}
        />
      )}
    </div>
  );
};
