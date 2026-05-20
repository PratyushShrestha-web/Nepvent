'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, MapPin, Clock, Users, ArrowLeft, Loader2, Bell, BellOff } from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string
  location: string
  latitude: number
  longitude: number
  event_date: string
  user_id: string
  created_at: string
}

interface EventDetail extends Event {
  organizer_email: string
  likes_count: number
  interests_count: number
  user_liked: boolean
  user_interested: boolean
}

export default function EventDetailPage() {
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const eventId = params.id as string

  useEffect(() => {
    const loadEvent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        // Fetch event
        const { data: eventData, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (error) throw error

        if (!eventData) {
          router.push('/')
          return
        }

        // Get likes count
        const { count: likesCount } = await supabase
          .from('event_likes')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)

        // Get interests count
        const { count: interestsCount } = await supabase
          .from('event_interests')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)

        // Check if user liked
        const { data: likeData } = await supabase
          .from('event_likes')
          .select()
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single()

        // Check if user interested
        const { data: interestData } = await supabase
          .from('event_interests')
          .select()
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single()

        setEvent({
          ...eventData,
          organizer_email: user.email || 'Unknown',
          likes_count: likesCount || 0,
          interests_count: interestsCount || 0,
          user_liked: !!likeData,
          user_interested: !!interestData,
        })
      } catch (error) {
        console.error('Error loading event:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadEvent()
  }, [eventId])

  const handleLike = async () => {
    if (!event || !user) return
    setIsUpdating(true)

    try {
      const response = await fetch('/api/events/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      })

      if (!response.ok) throw new Error('Failed to toggle like')

      const data = await response.json()
      setEvent({
        ...event,
        user_liked: data.liked,
        likes_count: data.liked ? event.likes_count + 1 : event.likes_count - 1,
      })
    } catch (error) {
      console.error('Error liking event:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleInterest = async () => {
    if (!event || !user) return
    setIsUpdating(true)

    try {
      const response = await fetch('/api/events/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      })

      if (!response.ok) throw new Error('Failed to toggle interest')

      const data = await response.json()
      setEvent({
        ...event,
        user_interested: data.interested,
        interests_count: data.interested ? event.interests_count + 1 : event.interests_count - 1,
      })
    } catch (error) {
      console.error('Error updating interest:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <>
        <Navigation user={user} />
        <div className="flex justify-center items-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Event not found</p>
        </div>
      </>
    )
  }

  const eventDate = new Date(event.event_date)

  return (
    <>
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <CardDescription>Posted on {new Date(event.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Location</h4>
                      <p className="text-muted-foreground">{event.location}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Coordinates: {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Date & Time</h4>
                      <p className="text-muted-foreground">
                        {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Interest</h4>
                      <p className="text-muted-foreground">{event.interests_count} people are interested</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Likes</span>
                  <span className="font-semibold text-lg">{event.likes_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Interested</span>
                  <span className="font-semibold text-lg">{event.interests_count}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button
                size="lg"
                className="w-full gap-2"
                variant={event.user_liked ? 'default' : 'outline'}
                onClick={handleLike}
                disabled={isUpdating}
              >
                <Heart className={`w-4 h-4 ${event.user_liked ? 'fill-current' : ''}`} />
                {event.user_liked ? 'Liked' : 'Like Event'}
              </Button>

              <Button
                size="lg"
                className="w-full gap-2"
                variant={event.user_interested ? 'default' : 'outline'}
                onClick={handleInterest}
                disabled={isUpdating}
              >
                {event.user_interested ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    Remove Interest
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Express Interest
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
