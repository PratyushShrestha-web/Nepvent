'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import EventCard from '@/components/event-card'
import LocationFilter from '@/components/location-filter'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/navigation'
import { Loader2 } from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string
  location: string
  latitude: number
  longitude: number
  event_date: string
  user_id: string
}

interface EventWithInteractions extends Event {
  likes_count?: number
  interests_count?: number
  user_liked?: boolean
  user_interested?: boolean
}

export default function HomePage() {
  const [events, setEvents] = useState<EventWithInteractions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [currentLat, setCurrentLat] = useState<number | null>(null)
  const [currentLng, setCurrentLng] = useState<number | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [radius, setRadius] = useState(50)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          router.push('/auth/login')
          return
        }
        
        setUser(authUser)
        // Load initial events
        setIsLoading(true)
        const response = await fetch('/api/events')
        if (!response.ok) throw new Error('Failed to fetch events')
        
        const data = await response.json()
        if (data.events) {
          setEvents(data.events.map((event: Event) => ({
            ...event,
            likes_count: 0,
            interests_count: 0,
            user_liked: false,
            user_interested: false,
          })))
        }
        setIsLoading(false)
      } catch (error) {
        console.error('[v0] Auth error:', error)
        setIsLoading(false)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  const fetchEvents = async (lat?: number, lng?: number, searchRadius?: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (lat && lng) {
        params.append('lat', lat.toString())
        params.append('lng', lng.toString())
        params.append('radius', (searchRadius || radius).toString())
      }

      const response = await fetch(`/api/events?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[v0] Fetched events:', data)

      if (!user || !data.events) {
        setEvents([])
        return
      }

      // Fetch interactions for current user
      const { data: likes } = await supabase
        .from('event_likes')
        .select('event_id')
        .eq('user_id', user.id)

      const { data: interests } = await supabase
        .from('event_interests')
        .select('event_id')
        .eq('user_id', user.id)

      const likedEventIds = new Set(likes?.map(l => l.event_id) || [])
      const interestedEventIds = new Set(interests?.map(i => i.event_id) || [])

      // Get counts for each event
      const eventsWithCounts = await Promise.all(
        (data.events || []).map(async (event: Event) => {
          const { count: likesCount } = await supabase
            .from('event_likes')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          const { count: interestsCount } = await supabase
            .from('event_interests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          return {
            ...event,
            likes_count: likesCount || 0,
            interests_count: interestsCount || 0,
            user_liked: likedEventIds.has(event.id),
            user_interested: interestedEventIds.has(event.id),
          }
        })
      )

      setEvents(eventsWithCounts)
    } catch (error) {
      console.error('[v0] Error fetching events:', error)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationChange = async (lat: number, lng: number, location: string) => {
    setCurrentLat(lat)
    setCurrentLng(lng)
    setCurrentLocation(location)
    await fetchEvents(lat, lng, radius)
  }

  const handleRadiusChange = async (newRadius: number) => {
    setRadius(newRadius)
    if (currentLat && currentLng) {
      await fetchEvents(currentLat, currentLng, newRadius)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Local Events</h1>
          <p className="text-muted-foreground">Find and explore events happening near you</p>
        </div>

        <div className="mb-8 bg-card border rounded-lg p-6">
          <LocationFilter onLocationChange={handleLocationChange} onRadiusChange={handleRadiusChange} currentRadius={radius} />
          {currentLocation && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing events near: <span className="font-medium">{currentLocation}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No events found. Try searching in a different location or with a larger radius.</p>
            <Button onClick={() => fetchEvents()}>Show All Events</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isLiked={event.user_liked}
                likeCount={event.likes_count}
                interestCount={event.interests_count}
                onLike={() => fetchEvents(currentLat || undefined, currentLng || undefined)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
