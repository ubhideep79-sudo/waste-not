import React, { useState, useEffect } from "react";
import { AuditLogItem } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { History, Shield, Filter, Search, RotateCcw } from "lucide-react";

export const AuditLogView: React.FC = () => {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string>("All");

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        entityType: selectedEntity !== "All" ? selectedEntity : undefined,
        limit: 100,
      });
      setLogs(res.logs);
    } catch (err: any) {
      toast.error("Failed to load audit logs: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [selectedEntity]);

  const filteredLogs = logs.filter(
    (l) =>
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.performedByName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#12372A] font-display">
          System Security & Activity Audit Trail
        </h1>
        <p className="text-xs text-[#52796F]">
          Immutable chronological log of all stock adjustments, waste entries, deletions, and user actions
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl bg-white border border-[#D5DDD8] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search audit details or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#D5DDD8] pl-8 pr-3 py-2 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="text-xs rounded-lg border border-[#D5DDD8] bg-white px-3 py-2 focus:border-[#2D6A4F] outline-hidden"
          >
            <option value="All">All Operations</option>
            <option value="WasteRecord">Waste Record Operations</option>
            <option value="Ingredient">Inventory & Stock Operations</option>
            <option value="User">User & Auth Operations</option>
            <option value="AppSetting">Hotel Settings / Budget</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setSelectedEntity("All");
              loadAuditLogs();
            }}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800"
            title="Refresh logs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#D5DDD8] shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading security logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#D5DDD8] text-[11px] font-semibold uppercase tracking-wider text-[#52796F]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Audit Details & Event Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFE9]">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-[#12372A]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-500">
                      {log.entityType}
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {log.performedByName}
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-mono">
                        {log.performedByRole}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-slate-700 leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
