import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '50'

  try {
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })

    // If location filters provided, use distance calculation
    if (lat && lng) {
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      const radiusNum = parseFloat(radius)

      // Fetch all events and filter on client side (simple approach)
      const { data, error } = await query
      
      if (error) throw error

      // Simple distance calculation (Haversine formula)
      const filtered = data?.filter((event: any) => {
        const R = 6371 // Earth's radius in km
        const dLat = (parseFloat(event.latitude) - latNum) * Math.PI / 180
        const dLng = (parseFloat(event.longitude) - lngNum) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latNum * Math.PI / 180) * Math.cos(parseFloat(event.latitude) * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c
        return distance <= radiusNum
      }) || []

      return NextResponse.json({
        events: filtered,
        userLikes: [],
        userInterests: []
      })
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      events: data || [],
      userLikes: [],
      userInterests: []
    })
  } catch (error: unknown) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

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
    const { title, description, location, latitude, longitude, event_date } = body

    if (!title || !description || !location || latitude === undefined || longitude === undefined || !event_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title,
        description,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        event_date,
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
