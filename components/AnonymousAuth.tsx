'use client'

import { useEffect } from 'react'
import { ensureAnonymousSession } from '@/lib/supabase/client'

export default function AnonymousAuth() {
  useEffect(() => {
    ensureAnonymousSession()
  }, [])

  return null
}