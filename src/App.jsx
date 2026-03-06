import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import GroupForm from './pages/GroupForm'
import Success from './pages/Success'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import ProtectedRoute from './pages/admin/ProtectedRoute'
import FloatingPetals from './components/FloatingPetals'

export default function App() {
    return (
        <div className="relative min-h-screen">
            <FloatingPetals />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/form" element={<GroupForm />} />
                <Route path="/success" element={<Success />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    )
}
