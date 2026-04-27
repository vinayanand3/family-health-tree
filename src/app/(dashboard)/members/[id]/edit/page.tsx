import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditMemberForm } from '@/components/members/EditMemberForm'
import { RelationshipManager } from '@/components/members/RelationshipManager'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Person, Relationship } from '@/types'

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: person } = await supabase.from('persons').select('*').eq('id', id).single()

  if (!person) notFound()

  const [personsResult, relationshipsResult] = await Promise.all([
    supabase
      .from('persons')
      .select('*')
      .eq('family_id', person.family_id)
      .order('first_name'),
    supabase
      .from('relationships')
      .select('*')
      .eq('family_id', person.family_id)
      .or(`person_id.eq.${id},related_person_id.eq.${id}`),
  ])

  const persons = (personsResult.data ?? []) as Person[]
  const relationships = (relationshipsResult.data ?? []) as Relationship[]

  return (
    <div className="max-w-3xl">
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

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <RelationshipManager
            person={person as Person}
            persons={persons}
            relationships={relationships}
          />
        </CardContent>
      </Card>
    </div>
  )
}
