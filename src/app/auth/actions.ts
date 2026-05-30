'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Use string conversion to handle FormDataEntryValue correctly
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Clear stale session
  await supabase.auth.signOut()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error for', email, ':', error)
    return { error: error.message }
  }
  
  console.log('Login successful for user:', data.user?.id)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Clear stale session
  await supabase.auth.signOut()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    }
  })

  if (error) {
    console.error('Signup error for', email, ':', error)
    return { error: error.message }
  }

  console.log('Signup successful for user:', data.user?.id)

  // After signup, we log them in and redirect
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Logout error:', error)
  } else {
    console.log('Logout successful')
  }
  
  revalidatePath('/', 'layout')
  redirect('/')
}
