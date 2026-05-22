'use client'
import  Navbar  from '@/components/ui/navbar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function SignUpSuccess() {
  return (
    <div className="min-h-svh flex flex-col">
      
      <Navbar />

      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-[260px]">
          <CardContent className="flex flex-col items-center text-center gap-3 p-4">
            
            <div className="text-2xl">📧</div>

            <h1 className="text-sm font-semibold">
              Check your email
            </h1>

            <p className="text-[11px] text-muted-foreground">
              Confirmation link sent.
            </p>

            <Link href="/auth/login" className="w-full">
              <Button size="sm" className="w-full h-8 text-xs">
                Login
              </Button>
            </Link>

          </CardContent>
        </Card>
      </div>

    </div>
  )
}