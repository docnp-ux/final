import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthProvider'

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  // Forward whatever context an ancestor route passed — see AdminRoute.
  const context = useOutletContext()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />
  }

  return <Outlet context={context} />
}

export default ProtectedRoute
