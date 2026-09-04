import { useEffect, useState } from 'react'
import { NavLink, useLocation, useMatch, useNavigate } from 'react-router'

import { listDevices } from '@/api/devices'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthProvider'
import type { Device } from '@/schemas/device'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block rounded-md px-3 py-1.5 text-sm',
    isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
  )

const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block rounded-md px-3 py-1.5 text-sm',
    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
  )

function Sidebar() {
  const { isAuthenticated, user } = useAuth()
  const isAdmin = !!user?.is_admin
  const navigate = useNavigate()
  const location = useLocation()

  const match = useMatch('/devices/:deviceId/*')
  const deviceIdParam = match?.params.deviceId
  const subPageMatch = useMatch('/devices/:deviceId/:subPage')
  const subPage = subPageMatch?.params.subPage ?? 'overview'
  const isRealDevice = !!deviceIdParam && /^\d+$/.test(deviceIdParam)

  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    if (!isAuthenticated) return
    listDevices()
      .then(setDevices)
      .catch(() => {})
    // Refetch on every route change (not just once on login) so a newly
    // registered device shows up in the switcher instead of leaving the
    // <select> pointed at a stale option list.
  }, [isAuthenticated, location.pathname])

  return (
    <aside className="w-52 shrink-0 space-y-6">
      <nav className="space-y-1">
        <NavLink to="/" end className={navLinkClass}>
          Home
        </NavLink>
        {isAuthenticated && (
          <NavLink to="/devices" end className={navLinkClass}>
            Devices
          </NavLink>
        )}
      </nav>

      {isAuthenticated && isRealDevice && (
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <label htmlFor="device-switch" className="text-xs text-muted-foreground">
              Device
            </label>
            <select
              id="device-switch"
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
              value={deviceIdParam}
              onChange={(e) => navigate(`/devices/${e.target.value}/${subPage}`)}
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <nav className="space-y-1">
            <NavLink to={`/devices/${deviceIdParam}/overview`} className={subNavLinkClass}>
              Overview
            </NavLink>
            {isAdmin && (
              <>
                <NavLink to={`/devices/${deviceIdParam}/live`} className={subNavLinkClass}>
                  Live
                </NavLink>
                <NavLink to={`/devices/${deviceIdParam}/sensors`} className={subNavLinkClass}>
                  Sensors
                </NavLink>
                <NavLink to={`/devices/${deviceIdParam}/graphs`} className={subNavLinkClass}>
                  Graphs
                </NavLink>
                <NavLink to={`/devices/${deviceIdParam}/override`} className={subNavLinkClass}>
                  Manual Override
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
