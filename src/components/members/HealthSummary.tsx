import { HealthCondition, Medication, Allergy } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pill, AlertTriangle, Activity } from 'lucide-react'

interface HealthSummaryProps {
  conditions: HealthCondition[]
  medications: Medication[]
  allergies: Allergy[]
}

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-700',
  chronic: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
}

const severityColors: Record<string, string> = {
  mild: 'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe: 'bg-red-100 text-red-700',
}

export function HealthSummary({ conditions, medications, allergies }: HealthSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500" />
            Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">None recorded</p>
          ) : (
            <ul className="space-y-2">
              {conditions.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.is_hereditary && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Hereditary
                      </span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-blue-500" />
            Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-sm text-muted-foreground">None recorded</p>
          ) : (
            <ul className="space-y-2">
              {medications.map((m) => (
                <li key={m.id}>
                  <p className="text-sm font-medium">{m.name}</p>
                  {(m.dosage || m.frequency) && (
                    <p className="text-xs text-muted-foreground">
                      {[m.dosage, m.frequency].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allergies.length === 0 ? (
            <p className="text-sm text-muted-foreground">None recorded</p>
          ) : (
            <ul className="space-y-2">
              {allergies.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.allergen}</p>
                  {a.severity && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[a.severity]}`}>
                      {a.severity}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
