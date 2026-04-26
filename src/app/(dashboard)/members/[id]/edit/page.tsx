import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditMemberForm } from '@/components/members/EditMemberForm'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: person } = await supabase.from('persons').select('*').eq('id', id).single()

  if (!person) notFound()

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/members/${id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit Member</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EditMemberForm person={person} />
        </CardContent>
      </Card>
    </div>
  )
}
