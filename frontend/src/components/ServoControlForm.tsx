import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { issueServoCommand } from '@/api/servo'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type ServoCommandFields, servoCommandSchema } from '@/schemas/servo'

function ServoControlForm({
  deviceId,
  onIssued,
}: {
  deviceId: number
  onIssued: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServoCommandFields>({
    resolver: zodResolver(servoCommandSchema),
    defaultValues: { target_x_angle: 90, target_y_angle: 90 },
  })

  const onSubmit = async (data: ServoCommandFields) => {
    try {
      await issueServoCommand(deviceId, data)
      toast.success('Servo command sent')
      onIssued()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send command')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-4">
      <Field className="w-32">
        <FieldLabel htmlFor="target_x_angle">X angle</FieldLabel>
        <Input
          id="target_x_angle"
          type="number"
          min={0}
          max={180}
          {...register('target_x_angle', { valueAsNumber: true })}
        />
        {errors.target_x_angle && (
          <div className="text-sm text-destructive">{errors.target_x_angle.message}</div>
        )}
      </Field>
      <Field className="w-32">
        <FieldLabel htmlFor="target_y_angle">Y angle</FieldLabel>
        <Input
          id="target_y_angle"
          type="number"
          min={0}
          max={180}
          {...register('target_y_angle', { valueAsNumber: true })}
        />
        {errors.target_y_angle && (
          <div className="text-sm text-destructive">{errors.target_y_angle.message}</div>
        )}
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send override command'}
      </Button>
    </form>
  )
}

export default ServoControlForm
