// Grade calculation utilities

export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

export function calculatePercentage(obtained: number, total: number): number {
  if (total === 0) return 0
  return Math.round((obtained / total) * 100 * 100) / 100
}

export function generateRollNumber(prefix: string = 'TFC', existingNumbers: string[] = []): string {
  let num = 1001
  while (existingNumbers.includes(`${prefix}-${num}`)) {
    num++
  }
  return `${prefix}-${num}`
}

export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+': return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
    case 'A': return 'text-green-700 bg-green-50 border border-green-200'
    case 'B': return 'text-blue-700 bg-blue-50 border border-blue-200'
    case 'C': return 'text-amber-700 bg-amber-50 border border-amber-200'
    case 'D': return 'text-orange-700 bg-orange-50 border border-orange-200'
    case 'F': return 'text-red-700 bg-red-50 border border-red-200'
    default: return 'text-slate-700 bg-slate-50 border border-slate-200'
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}
