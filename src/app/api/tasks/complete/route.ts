import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { taskId, status } = await req.json()
  if (!taskId || !status) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  // Verify ownership implicitly via RLS or explicitly:
  const { data: task } = await supabase
    .from('roadmap_tasks')
    .select('id, level_id')
    .eq('id', taskId)
    .single()

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Toggle status to 'completed' or 'pending'
  const { error } = await supabase
    .from('roadmap_tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) {
    console.error('Task update error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status })
}
