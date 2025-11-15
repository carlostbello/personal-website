'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Supabase client for client-side operations
 * Use this in Client Components with 'use client' directive
 */
export const supabase = createClient(supabaseUrl, supabaseKey)
