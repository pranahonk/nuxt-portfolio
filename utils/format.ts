export function formatJakartaTime(value: string): string {
  const date = new Date(value)
  // systemd human timestamps ("Wed 2026-10-07 10:00:00 CST") are not ISO and
  // parse to Invalid Date on WebKit, where Intl.format() throws RangeError
  // mid-render and blanks the whole page. Fall back to the raw string.
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
