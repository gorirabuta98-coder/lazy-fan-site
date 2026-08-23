'use client'

const DEVICE_ID_KEY = 'lake-fan-device-id'

export function getDeviceId(): string {
  const storedDeviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (storedDeviceId) return storedDeviceId

  const deviceId = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, deviceId)
  return deviceId
}
