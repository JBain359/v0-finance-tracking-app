'use client'
import { Descope } from '@descope/nextjs-sdk'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Descope
        flowId="sign-up-or-in"
        onSuccess={() => router.push('/')}
        onError={(e) => console.error(e)}
      />
    </div>
  )
}