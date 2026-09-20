import { createClient } from '@supabase/supabase-js'

// Server-only: uses the secret key. Shared by the /api/todo route and the todo page
// (a server component) so the page can ship with its data instead of fetching after load.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export type TodoRow = { id: number; name: string; content: string; position: number }

export async function getTodoTabs(): Promise<TodoRow[]> {
  const { data, error } = await supabase
    .from('vkliu_todo_content')
    .select('id, name, content, position')
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
