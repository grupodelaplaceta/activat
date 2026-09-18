export const FIRST_PAYMENT_MONTH = '2026-10';

export const DEFINITIVE_ACTIVITIES = {
  'Robòtica': {
    slug: 'robotica-2026-2027',
    schedule: 'Dimecres · 16:00–17:30 (berenar 16:00–16:45)',
    courses: '1r · 2n · 3r de Primària',
    nonMember: 20,
    member: 15,
    second: 0,
    third: 0,
    extra: 5,
    extraLabel: 'Material de Robòtica · primera quota d’octubre',
    capacity: 12,
  },
  'Acollida Matinal': {
    slug: 'acollida-matinal-2026-2027',
    schedule: 'Tots els dies · 08:00–09:15',
    courses: 'Infantil · Primària',
    nonMember: 30,
    member: 30,
    second: 5,
    third: 8.5,
    extra: 0,
    extraLabel: '',
    capacity: 12,
  },
} as const;

export type DefinitiveActivityName = keyof typeof DEFINITIVE_ACTIVITIES;

export function getDefinitiveActivity(name: string) {
  return DEFINITIVE_ACTIVITIES[name as DefinitiveActivityName] || DEFINITIVE_ACTIVITIES['Robòtica'];
}