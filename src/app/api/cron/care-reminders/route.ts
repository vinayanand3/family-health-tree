import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CareReminder, deliverCareReminder, ReminderRecipient } from '@/lib/reminders/delivery'

export const runtime = 'nodejs'

type PersonRow = {
  id: string
  family_id: string
  first_name: string
  last_name: string | null
}

function requireCronAuth(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

function personName(person: PersonRow | undefined) {
  if (!person) return 'A family member'
  return `${person.first_name}${person.last_name ? ` ${person.last_name}` : ''}`
}

export async function GET(request: NextRequest) {
  if (!requireCronAuth(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextTwoWeeks = new Date(now)
  nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14)
  const todayDate = now.toISOString().slice(0, 10)

  const [
    personsResult,
    appointmentsResult,
    medicationsResult,
    vaccinationsResult,
    familyMembersResult,
    preferencesResult,
    deliveryResult,
  ] = await Promise.all([
    supabase.from('persons').select('id, family_id, first_name, last_name'),
    supabase
      .from('appointments')
      .select('id, family_id, person_id, title, appointment_date, follow_up_needed, follow_up_date, is_completed')
      .or('is_completed.eq.false,follow_up_needed.eq.true'),
    supabase
      .from('medications')
      .select('id, person_id, name, refill_due_date, reminder_enabled')
      .eq('reminder_enabled', true)
      .not('refill_due_date', 'is', null)
      .lte('refill_due_date', nextWeek.toISOString().slice(0, 10)),
    supabase
      .from('vaccinations')
      .select('id, person_id, vaccine_name, due_date, status')
      .not('status', 'eq', 'up_to_date')
      .not('due_date', 'is', null)
      .lte('due_date', nextTwoWeeks.toISOString().slice(0, 10)),
    supabase.from('family_members').select('family_id, user_id').not('user_id', 'is', null),
    supabase.from('user_notification_preferences').select('*'),
    supabase.from('care_reminder_deliveries').select('reminder_key, user_id, channel, status'),
  ])

  if (personsResult.error || appointmentsResult.error || medicationsResult.error || vaccinationsResult.error || familyMembersResult.error) {
    return NextResponse.json({
      ok: false,
      errors: [
        personsResult.error?.message,
        appointmentsResult.error?.message,
        medicationsResult.error?.message,
        vaccinationsResult.error?.message,
        familyMembersResult.error?.message,
      ].filter(Boolean),
    }, { status: 500 })
  }

  const people = new Map((personsResult.data ?? []).map((person) => [person.id, person as PersonRow]))
  const familyMembers = familyMembersResult.data ?? []
  const preferences = new Map((preferencesResult.data ?? []).map((preference) => [preference.user_id, preference]))
  const delivered = new Set(
    (deliveryResult.data ?? [])
      .filter((delivery) => delivery.status === 'sent')
      .map((delivery) => `${delivery.reminder_key}:${delivery.user_id}:${delivery.channel}`)
  )

  const reminders: CareReminder[] = []

  for (const appointment of appointmentsResult.data ?? []) {
    const isUpcoming =
      !appointment.is_completed &&
      appointment.appointment_date >= now.toISOString() &&
      appointment.appointment_date <= tomorrow.toISOString()
    const isFollowUp = appointment.follow_up_needed && appointment.follow_up_date && appointment.follow_up_date <= now.toISOString()
    if (!isUpcoming && !isFollowUp) continue
    const memberName = personName(people.get(appointment.person_id))
    reminders.push({
      key: isFollowUp ? `appointment-follow-up:${appointment.id}` : `appointment-upcoming:${appointment.id}`,
      familyId: appointment.family_id,
      title: isFollowUp ? `Follow-up needed for ${memberName}` : `Appointment reminder for ${memberName}`,
      message: isFollowUp
        ? `${appointment.title} has a follow-up due.`
        : `${appointment.title} is scheduled for ${new Date(appointment.appointment_date).toLocaleString()}.`,
      actionUrl: '/appointments',
      priority: isFollowUp ? 'high' : 'medium',
    })
  }

  for (const medication of medicationsResult.data ?? []) {
    const person = people.get(medication.person_id)
    if (!person) continue
    reminders.push({
      key: `medication-refill:${medication.id}:${medication.refill_due_date}`,
      familyId: person.family_id,
      title: `Refill due for ${personName(person)}`,
      message: `${medication.name} has a refill due ${medication.refill_due_date && medication.refill_due_date < todayDate ? 'now' : `by ${medication.refill_due_date}`}.`,
      actionUrl: `/members/${person.id}`,
      priority: 'medium',
    })
  }

  for (const vaccination of vaccinationsResult.data ?? []) {
    const person = people.get(vaccination.person_id)
    if (!person) continue
    reminders.push({
      key: `vaccination:${vaccination.id}:${vaccination.due_date}`,
      familyId: person.family_id,
      title: `Vaccination ${vaccination.status === 'overdue' || (vaccination.due_date ?? '') < todayDate ? 'overdue' : 'due soon'} for ${personName(person)}`,
      message: `${vaccination.vaccine_name} is due ${vaccination.due_date}.`,
      actionUrl: `/members/${person.id}`,
      priority: vaccination.status === 'overdue' || vaccination.due_date < todayDate ? 'high' : 'medium',
    })
  }

  const recipientsByFamily = new Map<string, ReminderRecipient[]>()
  for (const member of familyMembers) {
    if (!member.user_id) continue
    const preference = preferences.get(member.user_id)
    const { data: userResult } = await supabase.auth.admin.getUserById(member.user_id)
    const recipient: ReminderRecipient = {
      familyId: member.family_id,
      userId: member.user_id,
      email: userResult.user?.email ?? null,
      emailEnabled: preference?.email_enabled ?? true,
      smsEnabled: preference?.sms_enabled ?? false,
      phoneNumber: preference?.phone_number ?? null,
      pushEnabled: preference?.push_enabled ?? false,
    }
    const familyRecipients = recipientsByFamily.get(member.family_id) ?? []
    familyRecipients.push(recipient)
    recipientsByFamily.set(member.family_id, familyRecipients)
  }

  let attempted = 0
  const results = []
  for (const reminder of reminders) {
    for (const recipient of recipientsByFamily.get(reminder.familyId) ?? []) {
      const alreadySent = ['email', 'sms', 'push'].some((channel) =>
        delivered.has(`${reminder.key}:${recipient.userId}:${channel}`)
      )
      if (alreadySent) continue
      attempted += 1
      results.push({
        reminder: reminder.key,
        userId: recipient.userId,
        channels: await deliverCareReminder(recipient, reminder),
      })
    }
  }

  return NextResponse.json({
    ok: true,
    remindersFound: reminders.length,
    deliveriesAttempted: attempted,
    results,
  })
}
