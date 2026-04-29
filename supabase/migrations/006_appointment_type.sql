alter table appointments
  add column if not exists appointment_type text check (
    appointment_type in (
      'checkup',
      'follow_up',
      'specialist',
      'dental',
      'vision',
      'pediatric',
      'urgent',
      'other'
    )
  );
