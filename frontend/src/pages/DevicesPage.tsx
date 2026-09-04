import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { deleteDevice, listDevices } from '@/api/devices'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/AuthProvider'
import type { Device } from '@/schemas/device'

export default function DevicesPage() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    listDevices()
      .then(setDevices)
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load devices'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (device: Device) => {
    if (!confirm(`Delete "${device.name}"? This also deletes all its readings and history.`)) return
    setDeletingId(device.id)
    try {
      await deleteDevice(device.id)
      setDevices((prev) => prev.filter((d) => d.id !== device.id))
      toast.success(`Device "${device.name}" deleted`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete device')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Devices</h1>

      {devices.length === 0 ? (
        <p className="text-muted-foreground">
          No devices registered yet. No hardware? Run <code>simulate_esp32.py</code> or{' '}
          <code>scripts/seed.py</code> on the backend to create one.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {user?.is_admin && <TableHead>Owner</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.name}</TableCell>
                {user?.is_admin && <TableCell>{device.owner_username}</TableCell>}
                <TableCell>{device.is_active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : '—'}
                </TableCell>
                <TableCell className="space-x-3">
                  <Link to={`/devices/${device.id}`} className="text-primary underline">
                    View dashboard
                  </Link>
                  {user?.is_admin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === device.id}
                      onClick={() => handleDelete(device)}
                    >
                      {deletingId === device.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
