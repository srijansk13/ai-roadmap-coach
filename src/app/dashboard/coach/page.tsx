import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from './chat-interface'

export default async function CoachPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Find the active chat or create one
  let { data: chat } = await supabase
    .from('chats')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!chat) {
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title: 'Career Strategy Session',
        coach_mode: 'Career Coach',
        is_active: true
      })
      .select('id')
      .single()
      
    if (error) {
      console.error("Failed to create chat", error)
      return <div>Error loading AI Coach.</div>
    }
    chat = newChat
  }

  // Load initial messages
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true })

  const initialMessages = messages?.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content
  })) || []

  return (
    <div className="h-full pt-4">
      <ChatInterface chatId={chat.id} initialMessages={initialMessages} />
    </div>
  )
}
