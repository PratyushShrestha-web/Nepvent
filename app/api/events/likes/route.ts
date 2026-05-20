import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing eventId' },
        { status: 400 }
      )
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from('event_likes')
      .select()
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('event_likes')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (error) throw error

      return NextResponse.json({ liked: false })
    } else {
      // Like
      const { error } = await supabase
        .from('event_likes')
        .insert({
          event_id: eventId,
          user_id: user.id,
        })

      if (error) throw error

      return NextResponse.json({ liked: true })
    }
  } catch (error: unknown) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
