import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { listUsers } from '@/api/auth'
import { registerDevice } from '@/api/devices'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthProvider'
import type { User } from '@/schemas/auth'
import { type DeviceCreateFields, type DeviceCreated, deviceCreateSchema } from '@/schemas/device'

export default function DeviceRegisterPage() {
  const { user } = useAuth()
  const [created, setCreated] = useState<DeviceCreated | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!user?.is_admin) return
    listUsers()
      .then(setUsers)
      .catch(() => {})
  }, [user?.is_admin])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeviceCreateFields>({
    resolver: zodResolver(deviceCreateSchema),
  })

  const onSubmit = async (data: DeviceCreateFields) => {
    try {
      const device = await registerDevice(data)
      setCreated(device)
      toast.success(`Device "${device.name}" registered`)
      reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to register device')
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Register a device</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded border border-border bg-background p-8 shadow-sm"
      >
        <Field>
          <FieldLabel htmlFor="name">Device name</FieldLabel>
          <Input id="name" placeholder="solar-tracker-01" {...register('name')} />
          {errors.name && <div className="text-sm text-destructive">{errors.name.message}</div>}
        </Field>
        {user?.is_admin && (
          <Field>
            <FieldLabel htmlFor="owner_id">Owner (optional)</FieldLabel>
            <select
              id="owner_id"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register('owner_id', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            >
              <option value="">Myself ({user.username})</option>
              {users
                .filter((u) => u.id !== user.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register device'}
        </Button>
      </form>

      {created && (
        <div className="space-y-2 rounded border border-border bg-muted p-4 text-sm">
          <p className="font-medium">
            API key for "{created.name}" (shown once — copy it onto the device or
            simulate_esp32.py):
          </p>
          <code className="block break-all rounded bg-background p-2">{created.api_key}</code>
        </div>
      )}
    </div>
  )
}
