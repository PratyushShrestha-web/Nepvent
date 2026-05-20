'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

interface LocationFilterProps {
  onLocationChange: (lat: number, lng: number, location: string) => void
  onRadiusChange: (radius: number) => void
  currentRadius?: number
}

export default function LocationFilter({ onLocationChange, onRadiusChange, currentRadius = 50 }: LocationFilterProps) {
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState(currentRadius)
  const [isLoading, setIsLoading] = useState(false)
  const [useGeolocation, setUseGeolocation] = useState(false)

  const handleGeolocation = () => {
    setIsLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          onLocationChange(latitude, longitude, `Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`)
          setUseGeolocation(true)
          setIsLoading(false)
        },
        (error) => {
          console.error('Error getting geolocation:', error)
          setIsLoading(false)
        }
      )
    }
  }

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) return

    setIsLoading(true)
    try {
      // Using OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
      )
      const data = await response.json()

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0]
        onLocationChange(parseFloat(lat), parseFloat(lon), display_name)
        setUseGeolocation(false)
      }
    } catch (error) {
      console.error('Error searching location:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <form onSubmit={handleLocationSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="Search by city or address..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          onClick={handleGeolocation}
          disabled={isLoading}
          className="gap-2"
        >
          <MapPin className="w-4 h-4" />
          {isLoading ? 'Getting location...' : 'Use My Location'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Search Radius: {radius} km</label>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={radius}
          onChange={(e) => {
            const newRadius = parseInt(e.target.value)
            setRadius(newRadius)
            onRadiusChange(newRadius)
          }}
          className="w-full"
        />
      </div>
    </div>
  )
}
