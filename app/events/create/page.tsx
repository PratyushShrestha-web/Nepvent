'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, MapPin } from 'lucide-react'

export default function CreateEventPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    event_date: '',
    event_time: '',
  })

  const [locationResults, setLocationResults] = useState<any[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        router.push('/auth/login')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setLocationResults([])
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      )
      const data = await response.json()
      setLocationResults(data)
      setShowLocationSuggestions(true)
    } catch (error) {
      console.error('Error searching location:', error)
    }
  }

  const handleLocationSelect = (result: any) => {
    setFormData({
      ...formData,
      location: result.display_name,
      latitude: result.lat,
      longitude: result.lon,
    })
    setShowLocationSuggestions(false)
    setLocationResults([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === 'location') {
      searchLocation(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (!user) {
        setError('You must be logged in to create an event')
        return
      }

      // Validate required fields
      if (!formData.title || !formData.description || !formData.location || !formData.latitude || !formData.longitude || !formData.event_date || !formData.event_time) {
        setError('Please fill in all required fields')
        setIsSubmitting(false)
        return
      }

      // Combine date and time
      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}:00`)

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          event_date: eventDateTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      const newEvent = await response.json()
      setSuccess(true)

      // Redirect after success
      setTimeout(() => {
        router.push(`/events/${newEvent.id}`)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
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
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create an Event</CardTitle>
              <CardDescription>Share your event with the community</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                    Event created successfully! Redirecting...
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Summer Music Festival"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your event in detail..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <Input
                      id="location"
                      name="location"
                      placeholder="Search for a location..."
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    {showLocationSuggestions && locationResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                        {locationResults.map((result, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleLocationSelect(result)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                          >
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{result.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.latitude && formData.longitude && (
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date *</Label>
                    <Input
                      id="event_date"
                      name="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_time">Event Time *</Label>
                    <Input
                      id="event_time"
                      name="event_time"
                      type="time"
                      value={formData.event_time}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Event...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
