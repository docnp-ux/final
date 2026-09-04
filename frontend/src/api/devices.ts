import { apiFetch } from '@/api/client'
import type { Device, DeviceCreated, DeviceCreateFields } from '@/schemas/device'

export async function listDevices(): Promise<Device[]> {
  return apiFetch<Device[]>('/devices')
}

export async function getDevice(id: number): Promise<Device> {
  return apiFetch<Device>(`/devices/${id}`)
}

export async function registerDevice(fields: DeviceCreateFields): Promise<DeviceCreated> {
  return apiFetch<DeviceCreated>('/devices', {
    method: 'POST',
    body: JSON.stringify(fields),
  })
}

export async function deleteDevice(id: number): Promise<void> {
  await apiFetch<void>(`/devices/${id}`, { method: 'DELETE' })
}
