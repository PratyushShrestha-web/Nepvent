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

    // Check if already interested
    const { data: existing } = await supabase
      .from('event_interests')
      .select()
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Remove interest
      const { error } = await supabase
        .from('event_interests')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (error) throw error

      return NextResponse.json({ interested: false })
    } else {
      // Add interest
      const { error } = await supabase
        .from('event_interests')
        .insert({
          event_id: eventId,
          user_id: user.id,
          notified: false,
        })

      if (error) throw error

      return NextResponse.json({ interested: true })
    }
  } catch (error: unknown) {
    console.error('Error toggling interest:', error)
    return NextResponse.json(
      { error: 'Failed to toggle interest' },
      { status: 500 }
    )
  }
}
