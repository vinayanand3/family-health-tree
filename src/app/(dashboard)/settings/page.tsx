'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, Mail } from 'lucide-react'
import { Family, UserRole } from '@/types'

interface FamilyState {
  family_id: string
  role: UserRole
  families: Family
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [family, setFamily] = useState<FamilyState | null>(null)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [message, setMessage] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    async function loadFamily() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: fm } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user!.id)
        .single()

      if (fm) setFamily(fm)
    }
    loadFamily()
  }, [supabase])

  useEffect(() => {
    const savedInviteCode = window.localStorage.getItem('familyhealth_invite_code')
    if (savedInviteCode && !family?.families) {
      queueMicrotask(() => {
        setInviteCode(savedInviteCode)
        setMessage('Invite code detected. Click Join Family to connect to that family group.')
      })
    }
  }, [family?.families])

  async function createFamily() {
    if (!newFamilyName.trim()) return
    setLoading(true)
    const { data: newFamilyId, error } = await supabase
      .rpc('create_family', { family_name: newFamilyName.trim() })

    if (!error && newFamilyId) {
      const { data: fam } = await supabase
        .from('families')
        .select('*')
        .eq('id', newFamilyId)
        .single()
      setFamily({ families: fam, role: 'admin', family_id: newFamilyId })
      setNewFamilyName('')
      setMessage('Family created!')
    } else if (error) {
      setMessage('Error: ' + error.message)
    }
    setLoading(false)
  }

  async function joinFamily() {
    if (!inviteCode.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: fam } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode.trim().toLowerCase())
      .single()

    if (!fam) {
      setMessage('Invalid invite code.')
      setLoading(false)
      return
    }

    await supabase.from('family_members').insert({
      family_id: fam.id,
      user_id: user!.id,
      role: 'member',
    })

    setFamily({ ...family, families: fam, role: 'member', family_id: fam.id })
    setInviteCode('')
    window.localStorage.removeItem('familyhealth_invite_code')
    setMessage('Joined family!')
    setLoading(false)
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(family?.families?.invite_code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyInviteLink() {
    const code = family?.families?.invite_code ?? ''
    navigator.clipboard.writeText(`https://family-health-tree.vercel.app/signup?invite=${code}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function sendEmailInvite() {
    const code = family?.families?.invite_code ?? ''
    const appUrl = 'https://family-health-tree.vercel.app'
    const subject = encodeURIComponent(`Join my family on FamilyHealth`)
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to invite you to join our family health tracker on FamilyHealth.\n\n` +
      `1. Sign up at: ${appUrl}/signup?invite=${code}\n` +
      `2. If the code is not filled automatically, enter this invite code in Settings: ${code}\n\n` +
      `See you there!`
    )
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`
    setInviteEmail('')
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your family group</p>
      </div>

      {family?.families ? (
        <Card>
          <CardHeader>
            <CardTitle>{family.families.name}</CardTitle>
            <CardDescription>
              Your role: <Badge variant="secondary">{family.role}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Invite Code</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Share this code with family members so they can join.
              </p>
              <div className="flex gap-2">
                <Input value={family.families.invite_code} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={copyInviteCode}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-3 rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-bold">How relatives join</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                  <li>Send them this invite link or code.</li>
                  <li>They create their own account.</li>
                  <li>The code connects their account to this shared family workspace.</li>
                </ol>
                <Button type="button" variant="outline" size="sm" onClick={copyInviteLink} className="mt-3">
                  {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {linkCopied ? 'Invite link copied' : 'Copy invite link'}
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm">Invite by Email</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Send an email with the invite code and a link to the app.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family@example.com"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={sendEmailInvite}
                  disabled={!inviteEmail.trim()}
                  title="Send invite email"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Choose how to start</CardTitle>
              <CardDescription>
                Create a new family if you are setting up the workspace. Join a family if someone already sent you an invite code.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create a Family</CardTitle>
              <CardDescription>Start a new family group and invite others.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Family Name</Label>
                <Input
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="The Smith Family"
                />
              </div>
              <Button onClick={createFamily} disabled={loading || !newFamilyName.trim()}>
                Create Family
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Join a Family</CardTitle>
              <CardDescription>Enter an invite code from a family member.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Invite Code</Label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="abc12345"
                  className="font-mono"
                />
              </div>
              <Button onClick={joinFamily} variant="outline" disabled={loading || !inviteCode.trim()}>
                Join Family
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {message && <p className="text-sm text-green-600">{message}</p>}
    </div>
  )
}
