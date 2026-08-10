/**
 * Helpers de fecha en hora argentina.
 *
 * El servidor corre en UTC (Vercel), así que `new Date().getDate()` puede dar
 * el día equivocado entre las 21:00 y la medianoche locales. Todo lo que el
 * admin muestre como "hoy" tiene que calcularse con este offset.
 *
 * Argentina es UTC-3 fijo: no aplica horario de verano desde 2009.
 */
export const AR_UTC_OFFSET = '-03:00'

/** Fecha de hoy en Argentina, formato yyyy-mm-dd (el que usan los filtros). */
export function todayInArgentina(now: Date = new Date()): string {
  // en-CA formatea como yyyy-mm-dd.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Instante en que empezó el día de hoy en Argentina. */
export function startOfTodayInArgentina(now: Date = new Date()): Date {
  return new Date(`${todayInArgentina(now)}T00:00:00.000${AR_UTC_OFFSET}`)
}
