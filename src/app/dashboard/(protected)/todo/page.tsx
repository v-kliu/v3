import { getTodoTabs, type TodoRow } from '@/lib/todo-data'
import TodoClient from './TodoClient'

// Reads live data, so it must render per request rather than being baked in at build time.
export const dynamic = 'force-dynamic'

export default async function TodoPage() {
  let initial: TodoRow[] = []
  try {
    initial = await getTodoTabs()
  } catch {
    // The client falls back to fetching /api/todo itself.
  }
  return <TodoClient initial={initial} />
}
