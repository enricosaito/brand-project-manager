const DATE_SHORT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const DATE_LONG = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
})

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value
  // Date-only strings are interpreted as local dates to avoid off-by-one days.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

export function formatDate(value: string | Date, withYear = false) {
  const date = toDate(value)
  return withYear ? DATE_LONG.format(date) : DATE_SHORT.format(date)
}

export function formatDateRange(start: string, end: string) {
  const s = toDate(start)
  const e = toDate(end)
  const sameYear = s.getFullYear() === e.getFullYear()
  return `${sameYear ? DATE_SHORT.format(s) : DATE_LONG.format(s)} – ${DATE_LONG.format(e)}`
}

export function formatTime(value: string | Date) {
  return TIME.format(toDate(value))
}

export function formatRelative(value: string | Date, now = new Date()) {
  const date = toDate(value)
  const diff = now.getTime() - date.getTime()
  const seconds = Math.round(diff / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)

  if (seconds < 45) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  return DATE_SHORT.format(date)
}

/** Days until a date. Negative when the date has passed. */
export function daysUntil(value: string, now = new Date()) {
  const date = toDate(value)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((date.getTime() - startOfToday.getTime()) / 86_400_000)
}

export function formatDue(value: string, now = new Date()) {
  const days = daysUntil(value, now)
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days === -1) return "Yesterday"
  if (days < 0 && days > -7) return `${Math.abs(days)}d overdue`
  if (days > 0 && days < 7) return `In ${days}d`
  return DATE_SHORT.format(toDate(value))
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function formatDimensions(width?: number, height?: number) {
  if (!width || !height) return null
  return `${width} × ${height}`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Today as a YYYY-MM-DD string in local time. */
export function todayISO(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

let counter = 0
/** Lightweight unique id for client-side created records. */
export function createId(prefix: string) {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`
}
