import { Navigate, Outlet, useOutletContext } from 'react-router'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthProvider'

/** Like ProtectedRoute, but also requires user.is_admin. */
function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  // Forward whatever context an ancestor route passed (e.g. DeviceLayout's
  // device data) — otherwise this layer's own <Outlet/> would drop it for
  // every route nested below (like /devices/:id/sensors).
  const context = useOutletContext()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (!user?.is_admin) {
    return <Navigate to="/devices" />
  }

  return <Outlet context={context} />
}

export default AdminRoute
