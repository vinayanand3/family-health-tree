import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const inviteCodeFromUrl = searchParams.get('invite')?.trim().toLowerCase()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const inviteCode = inviteCodeFromUrl ?? user?.user_metadata?.invite_code?.trim?.().toLowerCase?.()

      if (user && inviteCode) {
        const { data: existingMembership } = await supabase
          .from('family_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existingMembership) {
          const { data: family } = await supabase
            .from('families')
            .select('id')
            .eq('invite_code', inviteCode)
            .maybeSingle()

          if (family) {
            await supabase.from('family_members').insert({
              family_id: family.id,
              user_id: user.id,
              role: 'member',
            })
          }
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
