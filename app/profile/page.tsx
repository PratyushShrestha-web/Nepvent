'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, User as UserIcon } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalLikes: 0,
    totalInterests: 0,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        // Get user's events count
        const { count: eventCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Get total likes from user's events
        const { data: userEvents } = await supabase
          .from('events')
          .select('id')
          .eq('user_id', user.id)

        let likesCount = 0
        let interestsCount = 0

        if (userEvents && userEvents.length > 0) {
          const eventIds = userEvents.map(e => e.id)

          // Count likes on user's events
          const { count: likes } = await supabase
            .from('event_likes')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds)

          // Count interests on user's events
          const { count: interests } = await supabase
            .from('event_interests')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds)

          likesCount = likes || 0
          interestsCount = interests || 0
        }

        setStats({
          totalEvents: eventCount || 0,
          totalLikes: likesCount,
          totalInterests: interestsCount,
        })
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

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

  return (
    <>
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">My Profile</CardTitle>
              <CardDescription>View your profile information and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{user.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalEvents}</div>
                    <p className="text-sm text-muted-foreground">Events Created</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalLikes}</div>
                    <p className="text-sm text-muted-foreground">Likes Received</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalInterests}</div>
                    <p className="text-sm text-muted-foreground">Interests Received</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={() => router.push('/my-events')} className="w-full">
                  View My Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
