import ServoControlForm from '@/components/ServoControlForm'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useDeviceContext } from './deviceContext'

export default function DeviceOverridePage() {
  const { id, position, commands, reloadAdminExtras } = useDeviceContext()

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Current position:{' '}
        {position ? `x=${position.x_angle}° y=${position.y_angle}°` : 'unknown'}
      </p>
      <ServoControlForm deviceId={id} onIssued={reloadAdminExtras} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Target</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issued</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commands.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                x={c.target_x_angle}° y={c.target_y_angle}°
              </TableCell>
              <TableCell>{c.status}</TableCell>
              <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
