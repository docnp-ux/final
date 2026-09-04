import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthProvider'

function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="mx-auto max-w-xl space-y-6 py-12 text-center">
      <h1 className="text-3xl font-bold">Solar Tracker</h1>
      <p className="text-muted-foreground">
        IoT dual-axis solar panel tracker: live sensor readings, generated power, and
        manual servo override — built for the AUEB Coding Factory 9 final project.
      </p>
      <div className="flex justify-center gap-3">
        {isAuthenticated ? (
          <Button asChild>
            <Link to="/devices">View devices</Link>
          </Button>
        ) : (
          <>
            <Button asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default HomePage
