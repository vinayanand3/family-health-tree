import { createAdminClient } from '@/lib/supabase/admin'

type ReminderChannel = 'email' | 'sms' | 'push'
type DeliveryStatus = 'sent' | 'skipped' | 'failed'

export interface ReminderRecipient {
  familyId: string
  userId: string
  email: string | null
  emailEnabled: boolean
  smsEnabled: boolean
  phoneNumber: string | null
  pushEnabled: boolean
}

export interface CareReminder {
  key: string
  familyId: string
  title: string
  message: string
  actionUrl: string
  priority: 'low' | 'medium' | 'high'
}

interface ProviderResult {
  channel: ReminderChannel
  status: DeliveryStatus
  provider: string
  error: string | null
}

function appBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return 'http://localhost:3000'
}

async function sendEmail(recipient: ReminderRecipient, reminder: CareReminder): Promise<ProviderResult> {
  if (!recipient.emailEnabled) {
    return { channel: 'email', status: 'skipped', provider: 'preferences', error: 'Email disabled' }
  }
  if (!recipient.email) {
    return { channel: 'email', status: 'skipped', provider: 'preferences', error: 'No email address' }
  }
  if (!process.env.RESEND_API_KEY) {
    return { channel: 'email', status: 'skipped', provider: 'resend', error: 'RESEND_API_KEY not configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.REMINDER_FROM_EMAIL || 'FamilyHealth <onboarding@resend.dev>',
      to: recipient.email,
      subject: reminder.title,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h2>${reminder.title}</h2>
          <p>${reminder.message}</p>
          <p><a href="${appBaseUrl()}${reminder.actionUrl}">Open FamilyHealth</a></p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    return { channel: 'email', status: 'failed', provider: 'resend', error: await response.text() }
  }

  return { channel: 'email', status: 'sent', provider: 'resend', error: null }
}

async function sendSms(recipient: ReminderRecipient, reminder: CareReminder): Promise<ProviderResult> {
  if (!recipient.smsEnabled) {
    return { channel: 'sms', status: 'skipped', provider: 'preferences', error: 'SMS disabled' }
  }
  if (!recipient.phoneNumber) {
    return { channel: 'sms', status: 'skipped', provider: 'preferences', error: 'No phone number' }
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER
  if (!accountSid || !authToken || !fromNumber) {
    return { channel: 'sms', status: 'skipped', provider: 'twilio', error: 'Twilio env vars not configured' }
  }

  const body = new URLSearchParams({
    To: recipient.phoneNumber,
    From: fromNumber,
    Body: `${reminder.title}: ${reminder.message} ${appBaseUrl()}${reminder.actionUrl}`,
  })

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    return { channel: 'sms', status: 'failed', provider: 'twilio', error: await response.text() }
  }

  return { channel: 'sms', status: 'sent', provider: 'twilio', error: null }
}

function pushResult(recipient: ReminderRecipient): ProviderResult {
  if (!recipient.pushEnabled) {
    return { channel: 'push', status: 'skipped', provider: 'preferences', error: 'Push disabled' }
  }
  return {
    channel: 'push',
    status: 'skipped',
    provider: 'web-push',
    error: 'Server push subscriptions are not configured yet',
  }
}

export async function deliverCareReminder(recipient: ReminderRecipient, reminder: CareReminder) {
  const supabase = createAdminClient()
  const channels = await Promise.all([
    sendEmail(recipient, reminder),
    sendSms(recipient, reminder),
    Promise.resolve(pushResult(recipient)),
  ])

  for (const result of channels) {
    await supabase.from('care_reminder_deliveries').upsert({
      reminder_key: reminder.key,
      family_id: reminder.familyId,
      user_id: recipient.userId,
      channel: result.channel,
      status: result.status,
      provider: result.provider,
      error: result.error,
      sent_at: new Date().toISOString(),
    }, {
      onConflict: 'reminder_key,user_id,channel',
      ignoreDuplicates: true,
    })
  }

  return channels
}
