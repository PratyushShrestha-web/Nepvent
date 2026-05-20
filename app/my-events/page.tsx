'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/navigation'
import EventCard from '@/components/event-card'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'

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

interface EventWithStats extends Event {
  likes_count: number
  interests_count: number
}

export default function MyEventsPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        // Fetch user's events
        const { data: userEvents, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('event_date', { ascending: false })

        if (error) throw error

        // Get stats for each event
        const eventsWithStats = await Promise.all(
          (userEvents || []).map(async (event: Event) => {
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
            }
          })
        )

        setEvents(eventsWithStats)
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    setDeletingId(eventId)

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id)

      if (error) throw error

      setEvents(events.filter(e => e.id !== eventId))
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    } finally {
      setDeletingId(null)
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
          <h1 className="text-3xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">Manage the events you&apos;ve created</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven&apos;t created any events yet.</p>
            <Button onClick={() => router.push('/events/create')}>Create Your First Event</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <EventCard
                    event={event}
                    likeCount={event.likes_count}
                    interestCount={event.interests_count}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                  disabled={deletingId === event.id}
                  className="mt-0 gap-1 flex-shrink-0"
                >
                  {deletingId === event.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
