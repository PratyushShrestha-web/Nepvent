'use client'

import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'

export default function Navbar() {
  return (
    <div className="w-full border-b flex justify-between items-center px-6 py-3">
      
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-6 w-6 object-contain"
        />
        <span className="text-sm font-semibold">Nepvent</span>
      </Link>

      {/* Menu */}
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/auth/login" className="text-sm">
                Login
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

    </div>
  )
}