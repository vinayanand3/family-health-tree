'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthCallbackUrl } from '@/lib/auth-redirect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'

export default function SignupPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('invite') ?? ''
    if (code) {
      const normalizedCode = code.trim().toLowerCase()
      queueMicrotask(() => setInviteCode(normalizedCode))
      window.localStorage.setItem('familyhealth_invite_code', normalizedCode)
    }
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const normalizedInviteCode = inviteCode.trim().toLowerCase()
    if (normalizedInviteCode) {
      window.localStorage.setItem('familyhealth_invite_code', normalizedInviteCode)
    }

    const redirectUrl = getAuthCallbackUrl(`/auth/callback${normalizedInviteCode ? `?invite=${normalizedInviteCode}` : ''}`)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: normalizedInviteCode ? { invite_code: normalizedInviteCode } : undefined,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  async function handleGoogleSignup() {
    setLoading(true)
    setError('')

    const normalizedInviteCode = inviteCode.trim().toLowerCase()
    if (normalizedInviteCode) {
      window.localStorage.setItem('familyhealth_invite_code', normalizedInviteCode)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(`/auth/callback${normalizedInviteCode ? `?invite=${normalizedInviteCode}` : ''}`),
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
            <span className="font-bold text-xl">FamilyHealth</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Start tracking your family&apos;s health</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
                </p>
              </div>
            ) : (
              <>
                <Button type="button" variant="outline" className="w-full mb-4" onClick={handleGoogleSignup} disabled={loading}>
                  <span className="text-base font-black text-primary">G</span>
                  Continue with Google
                </Button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or use email</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <Label htmlFor="inviteCode">Joining a family?</Label>
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Paste invite code, optional"
                      className="mt-2 font-mono"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      If a relative invited you, enter their code here. After signup, we will connect this account to their family group.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      minLength={6}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>
              </>
            )}

            {!success && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{' '}
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  Sign in
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
