'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BellRing, Copy, Check, Mail, Settings, Smartphone, UserPlus, Users } from 'lucide-react'
import { Family, Person, UserNotificationPreference, UserRole } from '@/types'

interface FamilyState {
  family_id: string
  role: UserRole
  families: Family
}

interface AccessMember {
  id: string
  user_id: string | null
  role: UserRole
  created_at: string
  email?: string | null
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
  const [accessMembers, setAccessMembers] = useState<AccessMember[]>([])
  const [profiles, setProfiles] = useState<Person[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [notificationPreference, setNotificationPreference] = useState<UserNotificationPreference | null>(null)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    async function loadFamily() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user!.id)
      const { data: fm } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user!.id)
        .single()

      if (fm) {
        setFamily(fm)
        const [membersResult, profilesResult, preferenceResult] = await Promise.all([
          supabase
            .from('family_members')
            .select('id, user_id, role, created_at')
            .eq('family_id', fm.family_id)
            .order('created_at'),
          supabase
            .from('persons')
            .select('*')
            .eq('family_id', fm.family_id)
            .order('first_name'),
          supabase
            .from('user_notification_preferences')
            .select('*')
            .eq('user_id', user!.id)
            .maybeSingle(),
        ])
        setAccessMembers(((membersResult.data ?? []) as AccessMember[]).map((member) => ({
          ...member,
          email: member.user_id === user!.id ? user!.email ?? null : null,
        })))
        setProfiles((profilesResult.data ?? []) as Person[])
        const preference = (preferenceResult.data ?? null) as UserNotificationPreference | null
        setNotificationPreference(preference)
        setEmailEnabled(preference?.email_enabled ?? true)
        setSmsEnabled(preference?.sms_enabled ?? false)
        setPushEnabled(preference?.push_enabled ?? false)
        setPhoneNumber(preference?.phone_number ?? '')
      }
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

  async function saveNotificationPreferences() {
    if (!currentUserId) return
    setLoading(true)
    const { data, error } = await supabase.from('user_notification_preferences').upsert({
      user_id: currentUserId,
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      push_enabled: pushEnabled,
      phone_number: phoneNumber.trim() || null,
      updated_at: new Date().toISOString(),
    }).select('*').single()

    setLoading(false)
    if (error) {
      setMessage('Error: ' + error.message)
      return
    }

    setNotificationPreference(data as UserNotificationPreference)
    setMessage('Reminder preferences saved.')
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-6">
        <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
          <Settings className="h-3.5 w-3.5" />
          Family workspace
        </p>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the current family, invite relatives, and keep the shared workspace connected.
        </p>
      </div>

      {family?.families ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <Card className="bg-white/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {family.families.name}
            </CardTitle>
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

          <Card className="bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Invite checklist
              </CardTitle>
              <CardDescription>Use this whenever a relative needs access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Copy the invite link.',
                'Send it to the family member.',
                'They sign up with email or Google.',
                'The invite code connects them to this family.',
              ].map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl border bg-white p-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-muted-foreground">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          </div>

          <Card className="bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Reminder delivery
              </CardTitle>
              <CardDescription>
                Daily background jobs can send appointment, refill, vaccination, and follow-up reminders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-2xl border bg-white p-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(event) => setEmailEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </label>
                <label className="flex items-center gap-2 rounded-2xl border bg-white p-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(event) => setSmsEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Smartphone className="h-4 w-4 text-primary" />
                  SMS
                </label>
                <label className="flex items-center gap-2 rounded-2xl border bg-white p-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={(event) => setPushEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <BellRing className="h-4 w-4 text-primary" />
                  Push
                </label>
              </div>
              <div className="space-y-1.5">
                <Label>SMS phone number</Label>
                <Input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+15551234567"
                />
                <p className="text-xs text-muted-foreground">
                  SMS sends only when Twilio environment variables are configured. Push is stored as a preference for future web push subscriptions.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="button" onClick={saveNotificationPreferences} disabled={loading}>
                  {loading ? 'Saving...' : 'Save reminder preferences'}
                </Button>
                {notificationPreference && (
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(notificationPreference.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Family management
              </CardTitle>
              <CardDescription>
                See who has app access and which health profiles are in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-black">App access</p>
                {accessMembers.length > 0 ? (
                  accessMembers.map((member) => {
                    const linkedProfile = profiles.find((profile) => profile.user_id === member.user_id)
                    const displayName = linkedProfile
                      ? `${linkedProfile.first_name} ${linkedProfile.last_name ?? ''}`.trim()
                      : member.email ?? 'Account pending'
                    return (
                      <div key={member.id} className="rounded-2xl border bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black">
                              {displayName}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Joined {new Date(member.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">{member.role}</Badge>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="rounded-2xl border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
                    No app access records found yet.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-black">Health profiles</p>
                {profiles.length > 0 ? (
                  profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-3">
                      <div>
                        <p className="text-sm font-black">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {profile.user_id ? 'Linked to an app account' : 'Profile only'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.location.href = `/members/${profile.id}/edit`
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
                    No health profiles yet. Add members to build the tree.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
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
