import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { ToastProvider, useToast } from "./context/ToastContext.tsx";
import { LoginPage } from "./components/auth/LoginPage.tsx";
import { Navbar } from "./components/common/Navbar.tsx";
import { Sidebar, NavTab } from "./components/common/Sidebar.tsx";

import { ManagerDashboard } from "./components/dashboard/ManagerDashboard.tsx";
import { StaffDashboard } from "./components/dashboard/StaffDashboard.tsx";
import { WasteLogList } from "./components/waste/WasteLogList.tsx";
import { RecordWasteModal } from "./components/waste/RecordWasteModal.tsx";
import { InventoryList } from "./components/inventory/InventoryList.tsx";
import { CostSavingAnalytics } from "./components/analytics/CostSavingAnalytics.tsx";
import { StaffManagement } from "./components/staff/StaffManagement.tsx";
import { AuditLogView } from "./components/audit/AuditLogView.tsx";
import { SettingsModal } from "./components/settings/SettingsModal.tsx";
import { GuidelinesView } from "./components/guidelines/GuidelinesView.tsx";

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, isManager } = useAuth();
  const toast = useToast();

  const [currentTab, setCurrentTab] = useState<NavTab>(
    isManager ? "dashboard" : "staff-dashboard"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isRecordWasteModalOpen, setIsRecordWasteModalOpen] =
    useState<boolean>(false);

  // Sync tab when role changes (e.g. from 1-click switcher)
  React.useEffect(() => {
    if (isManager && currentTab === "staff-dashboard") {
      setCurrentTab("dashboard");
    } else if (!isManager && currentTab === "dashboard") {
      setCurrentTab("staff-dashboard");
    }
  }, [isManager]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#12372A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#12372A] font-display">
          Waste Not, Want Not
        </p>
        <p className="text-[11px] text-[#52796F]">Loading hotel kitchen environment...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleSelectTab = (tab: NavTab) => {
    if (tab === "record-waste") {
      setIsRecordWasteModalOpen(true);
      return;
    }

    // Role-based route guard: Staff cannot access manager tabs
    const managerOnlyTabs: NavTab[] = [
      "dashboard",
      "analytics",
      "reports",
      "staff-team",
      "audit",
      "settings",
    ];

    if (!isManager && managerOnlyTabs.includes(tab)) {
      toast.warning("Access restricted. That section requires Manager permissions.");
      setCurrentTab("staff-dashboard");
      return;
    }

    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col antialiased text-[#162920]">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSettings={() => handleSelectTab("settings")}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === "dashboard" && (
            <ManagerDashboard
              onNavigateToWaste={() => handleSelectTab("waste-log")}
              onNavigateToInventory={() => handleSelectTab("inventory")}
              onNavigateToAnalytics={() => handleSelectTab("analytics")}
              onNavigateToReports={() => handleSelectTab("analytics")}
              onOpenRecordModal={() => setIsRecordWasteModalOpen(true)}
            />
          )}

          {currentTab === "staff-dashboard" && (
            <StaffDashboard
              onOpenRecordModal={() => setIsRecordWasteModalOpen(true)}
              onNavigateToMyWaste={() => handleSelectTab("waste-log")}
              onNavigateToInventory={() => handleSelectTab("inventory")}
              onNavigateToGuidelines={() => handleSelectTab("guidelines")}
            />
          )}

          {currentTab === "waste-log" && <WasteLogList />}

          {currentTab === "inventory" && <InventoryList />}

          {currentTab === "analytics" && <CostSavingAnalytics />}

          {currentTab === "reports" && <CostSavingAnalytics />}

          {currentTab === "staff-team" && <StaffManagement />}

          {currentTab === "audit" && <AuditLogView />}

          {currentTab === "settings" && <SettingsModal />}

          {currentTab === "guidelines" && <GuidelinesView />}
        </main>
      </div>

      {/* Universal Quick Food Waste Record Modal */}
      <RecordWasteModal
        isOpen={isRecordWasteModalOpen}
        onClose={() => setIsRecordWasteModalOpen(false)}
        onSuccess={() => {
          // If on waste log, reload or notify
          toast.success("Food waste entry successfully registered in database.");
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
