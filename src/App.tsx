import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { useStore } from './store/useStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { WorkOrderList, WorkOrderDetail } from './pages/WorkOrders'
import { StudentList, StudentDetail } from './pages/Students'
import QAPage from './pages/QA'
import KeyDatesPage from './pages/KeyDates'
import LibraryPage from './pages/Library'
import AdmissionsPage from './pages/Admissions'
import ParentDashboard from './pages/ParentDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ConfirmationCenter from './pages/ConfirmationCenter'

function App() {
  // 启动时加载数据源（mock 或真实钉钉，由 VITE_USE_REAL_DATA 决定）
  useEffect(() => {
    useStore.getState().loadAll()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/workorders" element={<WorkOrderList />} />
                <Route path="/workorders/:id" element={<WorkOrderDetail />} />
                <Route path="/students" element={<StudentList />} />
                <Route path="/students/:id" element={<StudentDetail />} />
                <Route path="/qa" element={<QAPage />} />
                <Route path="/dates" element={<KeyDatesPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/admissions" element={<AdmissionsPage />} />
                <Route path="/parent-dashboard" element={<ParentDashboard />} />
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route path="/confirm" element={<ConfirmationCenter />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
