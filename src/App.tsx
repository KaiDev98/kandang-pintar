/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { BottomNavigation, NavTab } from './components/layout/BottomNavigation.tsx';
import { Toast } from './components/layout/Toast.tsx';

// Views
import { HomeView } from './components/views/HomeView.tsx';
import { FlockView } from './components/views/FlockView.tsx';
import { FinanceView } from './components/views/FinanceView.tsx';
import { AssistantView } from './components/views/AssistantView.tsx';

// Modals
import { QuickLogModal } from './components/modals/QuickLogModal.tsx';
import { SalesWizardModal } from './components/modals/SalesWizardModal.tsx';
import { StartBroodingModal } from './components/modals/StartBroodingModal.tsx';
import { RecordHatchModal } from './components/modals/RecordHatchModal.tsx';
import { RecountModal } from './components/modals/RecountModal.tsx';
import { WeightSampleModal } from './components/modals/WeightSampleModal.tsx';
import { ExpenseModal } from './components/modals/ExpenseModal.tsx';
import { NotificationsModal } from './components/modals/NotificationsModal.tsx';
import { SettingsModal } from './components/modals/SettingsModal.tsx';
import { ExportModal } from './components/modals/ExportModal.tsx';
import { OnboardingModal } from './components/modals/OnboardingModal.tsx';

const AppContent: React.FC = () => {
  const { state } = useApp();

  const [activeTab, setActiveTab] = useState<NavTab>('beranda');

  // Modal visibility states
  const [quickLogFlockId, setQuickLogFlockId] = useState<string | undefined>(undefined);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);

  const [salesFlockId, setSalesFlockId] = useState<string | undefined>(undefined);
  const [isSalesWizardOpen, setIsSalesWizardOpen] = useState<boolean>(false);

  const [isStartBroodingOpen, setIsStartBroodingOpen] = useState<boolean>(false);
  const [recordHatchId, setRecordHatchId] = useState<string | undefined>(undefined);
  const [isRecordHatchOpen, setIsRecordHatchOpen] = useState<boolean>(false);

  const [recountFlockId, setRecountFlockId] = useState<string | null>(null);
  const [weightSampleFlockId, setWeightSampleFlockId] = useState<string | null>(null);
  const [expenseFlockId, setExpenseFlockId] = useState<string | undefined>(undefined);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Onboarding modal (auto open if not completed and not in autostart)
  const isAutostart = typeof window !== 'undefined' && window.location.search.includes('autostart=1');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(
    !isAutostart && !state.hasCompletedOnboarding
  );

  // Targeted flock selection for FlockView
  const [flockViewTargetId, setFlockViewTargetId] = useState<string | undefined>(undefined);

  const handleOpenQuickLog = (flockId?: string) => {
    setQuickLogFlockId(flockId);
    setIsQuickLogOpen(true);
  };

  const handleOpenSalesWizard = (flockId?: string) => {
    setSalesFlockId(flockId);
    setIsSalesWizardOpen(true);
  };

  const handleOpenExpenseModal = (flockId?: string) => {
    setExpenseFlockId(flockId);
    setIsExpenseModalOpen(true);
  };

  const handleNavigateToFlock = (flockId: string) => {
    setFlockViewTargetId(flockId);
    setActiveTab('ayam');
  };

  const handleNavigateToTab = (tab: string, payload?: Record<string, unknown>) => {
    if (tab === 'flock_detail') {
      if (payload?.flockId) {
        setFlockViewTargetId(String(payload.flockId));
      }
      setActiveTab('ayam');
    } else if (tab === 'quick_log') {
      handleOpenQuickLog();
    } else if (tab === 'sales_wizard') {
      handleOpenSalesWizard(payload?.flockId as string);
    } else if (tab === 'hatch_record') {
      setRecordHatchId(payload?.hatchId as string);
      setIsRecordHatchOpen(true);
    } else if (tab === 'notifikasi') {
      setIsNotificationsOpen(true);
    } else if (tab === 'keuangan') {
      setActiveTab('keuangan');
    } else {
      setActiveTab('beranda');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5EF] flex flex-col antialiased">
      {/* Top Header */}
      <Header
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Content Area (Max width 720px / 3xl as specified in design.md) */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-24">
        {activeTab === 'beranda' && (
          <HomeView
            onOpenQuickLog={handleOpenQuickLog}
            onNavigateToFlock={handleNavigateToFlock}
            onNavigateToTab={handleNavigateToTab}
          />
        )}

        {activeTab === 'ayam' && (
          <FlockView
            initialFlockId={flockViewTargetId}
            onOpenQuickLog={handleOpenQuickLog}
            onOpenStartBrooding={() => setIsStartBroodingOpen(true)}
            onOpenRecordHatch={(hId) => {
              setRecordHatchId(hId);
              setIsRecordHatchOpen(true);
            }}
            onOpenRecount={(fId) => setRecountFlockId(fId)}
            onOpenWeightSample={(fId) => setWeightSampleFlockId(fId)}
            onOpenSalesWizard={handleOpenSalesWizard}
          />
        )}

        {activeTab === 'keuangan' && (
          <FinanceView
            onOpenSalesWizard={handleOpenSalesWizard}
            onOpenExpenseModal={handleOpenExpenseModal}
          />
        )}

        {activeTab === 'asisten' && <AssistantView />}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setFlockViewTargetId(undefined);
        }}
        onOpenQuickLog={() => handleOpenQuickLog()}
      />

      {/* Global Toast */}
      <Toast />

      {/* Modals & Dialogs */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        preselectedFlockId={quickLogFlockId}
      />

      <SalesWizardModal
        isOpen={isSalesWizardOpen}
        onClose={() => setIsSalesWizardOpen(false)}
        preselectedFlockId={salesFlockId}
      />

      <StartBroodingModal
        isOpen={isStartBroodingOpen}
        onClose={() => setIsStartBroodingOpen(false)}
      />

      <RecordHatchModal
        isOpen={isRecordHatchOpen}
        onClose={() => setIsRecordHatchOpen(false)}
        preselectedHatchId={recordHatchId}
      />

      {recountFlockId && (
        <RecountModal
          isOpen={!!recountFlockId}
          onClose={() => setRecountFlockId(null)}
          flockId={recountFlockId}
        />
      )}

      {weightSampleFlockId && (
        <WeightSampleModal
          isOpen={!!weightSampleFlockId}
          onClose={() => setWeightSampleFlockId(null)}
          flockId={weightSampleFlockId}
        />
      )}

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        preselectedFlockId={expenseFlockId}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToTab={handleNavigateToTab}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
