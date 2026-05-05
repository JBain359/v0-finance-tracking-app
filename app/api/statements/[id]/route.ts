import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the statement to find the blob pathname
    const { data: statement } = await supabase
      .from('statements')
      .select('blob_pathname')
      .eq('id', id)
      .single()

    if (statement?.blob_pathname) {
      try {
        // Delete from blob storage
        await del(statement.blob_pathname)
      } catch (e) {
        console.error('Failed to delete blob:', e)
      }
    }

    // Delete statement (transactions will cascade delete)
    const { error } = await supabase
      .from('statements')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete statement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
