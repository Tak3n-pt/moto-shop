import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { WorkerTabProvider, useWorkerTab } from '@/context/WorkerTabContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import WorkerProfileView from './WorkerProfileView'
import Spinner from '../ui/Spinner'

function AppContent() {
  const { activeView, workerProfileVisible } = useWorkerTab()

  return (
    <main className="flex-1 ml-64 overflow-y-auto bg-bg-primary flex flex-col">
      <TopBar />
      <div className="flex-1 p-8">
        {typeof activeView === 'number' && workerProfileVisible ? (
          <WorkerProfileView workerId={activeView} />
        ) : (
          <Outlet />
        )}
      </div>
    </main>
  )
}

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <WorkerTabProvider>
      <div className="h-screen flex">
        <Sidebar />
        <AppContent />
      </div>
    </WorkerTabProvider>
  )
}
