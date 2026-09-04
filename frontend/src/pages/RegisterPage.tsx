import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { register as registerUser } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthProvider'
import { type RegisterFields, registerSchema } from '@/schemas/auth'

export default function RegisterPage() {
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFields) => {
    try {
      await registerUser(data)
      await loginUser(data)
      toast.success('Account created')
      navigate('/devices')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-sm space-y-6 rounded border border-border bg-background p-8 shadow-sm"
    >
      <h1 className="mb-4 text-center text-2xl font-bold">Sign up</h1>
      <Field>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input id="username" {...register('username')} />
        {errors.username && (
          <div className="text-sm text-destructive">{errors.username.message}</div>
        )}
        <p className="text-xs text-muted-foreground">
          Username "admin" is granted admin privileges for this demo.
        </p>
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <div className="text-sm text-destructive">{errors.password.message}</div>
        )}
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Sign up'}
      </Button>
    </form>
  )
}
