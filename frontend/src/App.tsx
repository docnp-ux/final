import { Navigate, Route, Routes } from 'react-router'

import AdminRoute from '@/components/AdminRoute'
import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import RouterLayout from '@/components/RouterLayout'
import DeviceRegisterPage from '@/pages/DeviceRegisterPage'
import DevicesPage from '@/pages/DevicesPage'
import DeviceGraphsPage from '@/pages/device/DeviceGraphsPage'
import DeviceLayout from '@/pages/device/DeviceLayout'
import DeviceLivePage from '@/pages/device/DeviceLivePage'
import DeviceOverridePage from '@/pages/device/DeviceOverridePage'
import DeviceOverviewPage from '@/pages/device/DeviceOverviewPage'
import DeviceSensorsPage from '@/pages/device/DeviceSensorsPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route element={<RouterLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="devices" element={<DevicesPage />} />
          <Route path="devices/register" element={<DeviceRegisterPage />} />

          <Route path="devices/:deviceId" element={<DeviceLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<DeviceOverviewPage />} />

            <Route element={<AdminRoute />}>
              <Route path="live" element={<DeviceLivePage />} />
              <Route path="sensors" element={<DeviceSensorsPage />} />
              <Route path="graphs" element={<DeviceGraphsPage />} />
              <Route path="override" element={<DeviceOverridePage />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
