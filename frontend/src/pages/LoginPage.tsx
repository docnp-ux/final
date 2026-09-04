import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthProvider'
import { type LoginFields, loginSchema } from '@/schemas/auth'

export default function LoginPage() {
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFields) => {
    try {
      await loginUser(data)
      toast.success('Login successful')
      navigate('/devices')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-sm space-y-6 rounded border border-border bg-background p-8 shadow-sm"
    >
      <h1 className="mb-4 text-center text-2xl font-bold">Login</h1>
      <Field>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input id="username" {...register('username')} />
        {errors.username && (
          <div className="text-sm text-destructive">{errors.username.message}</div>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <div className="text-sm text-destructive">{errors.password.message}</div>
        )}
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  )
}
