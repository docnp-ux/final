import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthProvider'

function Header() {
  const { isAuthenticated, user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-border bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="font-semibold">
          Solar Tracker
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {isAuthenticated ? (
            <>
              <Link to="/devices/register">Register Device</Link>
              <span className="text-muted-foreground">{user?.username}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Button asChild size="sm">
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
