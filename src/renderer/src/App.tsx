import { ReactElement } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useWorkerTab } from './context/WorkerTabContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CustomersPage from './pages/CustomersPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import PartsPage from './pages/PartsPage'
import PurchasePage from './pages/PurchasePage'
import PurchaseHistoryPage from './pages/PurchaseHistoryPage'
import JobsPage from './pages/JobsPage'
import NewJobPage from './pages/NewJobPage'
import JobDetailPage from './pages/JobDetailPage'
import ReportsPage from './pages/ReportsPage'
import WorkersPage from './pages/WorkersPage'
import SettingsPage from './pages/SettingsPage'
import ExpensesPage from './pages/ExpensesPage'
import SuppliersPage from './pages/SuppliersPage'
import SupplierDetailPage from './pages/SupplierDetailPage'
import CustomerDebtsPage from './pages/CustomerDebtsPage'
import PosPage from './pages/PosPage'
import PosSaleDetailPage from './pages/PosSaleDetailPage'

function AdminRoute({ children }: { children: ReactElement }) {
  const { user } = useAuth()
  const { activeView } = useWorkerTab()
  // Block if not admin OR if in worker tab mode
  if (user?.role !== 'admin' || typeof activeView === 'number') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/pos/sales/:id" element={<PosSaleDetailPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/parts" element={<AdminRoute><PartsPage /></AdminRoute>} />
        <Route path="/parts/purchase" element={<AdminRoute><PurchasePage /></AdminRoute>} />
        <Route path="/parts/purchases" element={<AdminRoute><PurchaseHistoryPage /></AdminRoute>} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/new" element={<NewJobPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/jobs/:id/edit" element={<NewJobPage />} />
        <Route path="/suppliers" element={<AdminRoute><SuppliersPage /></AdminRoute>} />
        <Route path="/suppliers/:id" element={<AdminRoute><SupplierDetailPage /></AdminRoute>} />
        <Route path="/debts" element={<AdminRoute><CustomerDebtsPage /></AdminRoute>} />
        <Route path="/expenses" element={<AdminRoute><ExpensesPage /></AdminRoute>} />
        <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="/workers" element={<AdminRoute><WorkersPage /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
