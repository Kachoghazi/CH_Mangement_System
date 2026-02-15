'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useUserStore } from '@/store/user-store';
import {
  BookIcon,
  HomeIcon,
  MenuIcon,
  XIcon,
  LogOut,
  User,
  CalendarIcon,
  UsersIcon,
  BarChart2,
  Settings,
} from 'lucide-react';
import { ToggleTheme } from './ThemeToggle';

/**
 * Header compatible with shadcn UI styling (no added background/text colors).
 * Replace anchor hrefs with your router Link component if using Next.js/App Router.
 */

const defaultNav = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Courses', href: '/courses', icon: BookIcon },
  { name: 'Students', href: '/students', icon: UsersIcon },
  { name: 'Schedule', href: '/schedule', icon: CalendarIcon },
  { name: 'Reports', href: '/reports', icon: BarChart2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Header = ({ navItems = defaultNav }) => {
  const { user, logout } = useUserStore(); // { fullName, role, avatarUrl }
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="rounded-md p-2">
                <span className="font-bold text-lg">CMS</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">Course Management System</h1>
                <p className="text-xs opacity-80">Manage students, courses & schedules</p>
              </div>
            </a>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Right side: user actions */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
            <ToggleTheme />
            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md p-1 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => setProfileOpen((v) => !v)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-muted">
                  {user?.fullName ? (
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff&size=128`}
                      alt={user.fullName || 'avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {(user?.fullName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-sm font-medium">{user?.fullName || 'User'}</span>
                  <span className="text-xs opacity-80">{user?.role || 'Admin'}</span>
                </div>
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div
                  role="menu"
                  aria-label="Profile options"
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-md ring-1 ring-black/5 bg-popover text-popover-foreground z-20"
                >
                  <a
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-accent/5"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </a>
                  <a
                    href="/account/settings"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-accent/5"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Account Settings</span>
                  </a>
                  <div className="border-t" />
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-accent/5 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:opacity-90"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}

            <div className="border-t pt-2">
              <a
                href="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:opacity-90"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </a>
              <button
                className="w-full text-left px-3 py-2 rounded-md hover:opacity-90 flex items-center"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 inline-block mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
