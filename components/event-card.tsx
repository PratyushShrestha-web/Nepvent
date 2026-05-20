'use client'

import Link from 'next/link'
import { Heart, MapPin, Clock, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface Event {
  id: string
  title: string
  description: string
  location: string
  event_date: string
  user_id: string
}

interface EventCardProps {
  event: Event
  isLiked?: boolean
  likeCount?: number
  interestCount?: number
  onLike?: () => void
}

export default function EventCard({ event, isLiked = false, likeCount = 0, interestCount = 0, onLike }: EventCardProps) {
  const [liked, setLiked] = useState(isLiked)
  const [likes, setLikes] = useState(likeCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/events/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      })

      if (!response.ok) throw new Error('Failed to toggle like')

      const data = await response.json()
      setLiked(data.liked)
      setLikes(data.liked ? likes + 1 : likes - 1)
      onLike?.()
    } catch (error) {
      console.error('Error liking event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const eventDate = new Date(event.event_date)
  const isUpcoming = eventDate > new Date()

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-balance line-clamp-2">{event.title}</CardTitle>
          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{interestCount} interested</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center pt-0">
          <div className="text-sm text-muted-foreground">{likes} likes</div>
          <Button
            size="sm"
            variant={liked ? 'default' : 'outline'}
            onClick={handleLike}
            disabled={isLoading}
            className="gap-1"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {liked ? 'Liked' : 'Like'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
