// Rate limiting for result checker
// Uses Supabase to track attempts per roll number + IP

import { supabase } from '@/lib/supabase/client'

export interface RateLimitResult {
  allowed: boolean
  attemptsLeft?: number
  lockedUntil?: Date
  error?: string
}

const MAX_ATTEMPTS = parseInt(process.env.RESULT_MAX_ATTEMPTS || '3')
const LOCKOUT_MINUTES = parseInt(process.env.RESULT_LOCKOUT_MINUTES || '15')

export async function checkRateLimit(rollNumber: string): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase
      .from('result_attempts')
      .select('*')
      .eq('roll_number', rollNumber)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine (first attempt)
      return { allowed: true }
    }

    if (!data) {
      return { allowed: true, attemptsLeft: MAX_ATTEMPTS }
    }

    // Check if currently locked
    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      return {
        allowed: false,
        lockedUntil: new Date(data.locked_until),
        error: `Too many failed attempts. Please try again after ${Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60000)} minutes.`
      }
    }

    const attemptsLeft = MAX_ATTEMPTS - (data.attempts || 0)
    if (attemptsLeft <= 0) {
      return {
        allowed: false,
        attemptsLeft: 0,
        error: 'Account locked due to too many failed attempts.'
      }
    }

    return { allowed: true, attemptsLeft }
  } catch {
    return { allowed: true } // Fail open for availability
  }
}

export async function recordFailedAttempt(rollNumber: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('result_attempts')
      .select('*')
      .eq('roll_number', rollNumber)
      .single()

    const currentAttempts = (data?.attempts || 0) + 1
    const shouldLock = currentAttempts >= MAX_ATTEMPTS

    const lockUntil = shouldLock
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      : null

    if (data) {
      await supabase
        .from('result_attempts')
        .update({
          attempts: currentAttempts,
          locked_until: lockUntil,
          last_attempt_at: new Date().toISOString()
        })
        .eq('roll_number', rollNumber)
    } else {
      await supabase
        .from('result_attempts')
        .insert({
          roll_number: rollNumber,
          attempts: 1,
          locked_until: lockUntil,
          last_attempt_at: new Date().toISOString()
        })
    }
  } catch {
    // Silently fail
  }
}

export async function resetAttempts(rollNumber: string): Promise<void> {
  try {
    await supabase
      .from('result_attempts')
      .delete()
      .eq('roll_number', rollNumber)
  } catch {
    // Silently fail
  }
}
