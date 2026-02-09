'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard as CurrencyIcon,
  ClipboardCheck,
  BarChart3,
  Settings,
  ChevronDown,
  Menu,
  Bell,
  LogOut,
  User,
  UserPlus,
  FileText,
  CreditCard,
  BookMarked,
  PlusCircle,
} from 'lucide-react';

// Menu items with role-based access
const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    title: 'Students',
    href: '/students',
    icon: GraduationCap,
    roles: ['admin', 'teacher'],
    submenu: [
      { title: 'All Students', href: '/students', icon: Users, roles: ['admin', 'teacher'] },
      { title: 'New Admission', href: '/students/new', icon: UserPlus, roles: ['admin'] },
      { title: 'Applications', href: '/students/applications', icon: FileText, roles: ['admin'] },
    ],
  },
  {
    title: 'Teachers',
    href: '/teachers',
    icon: Users,
    roles: ['admin'],
    submenu: [
      { title: 'All Teachers', href: '/teachers', icon: Users, roles: ['admin'] },
      { title: 'Add Teacher', href: '/teachers/new', icon: UserPlus, roles: ['admin'] },
    ],
  },
  {
    title: 'Approvals',
    href: '/approvals',
    icon: UserPlus,
    roles: ['admin'],
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpen,
    roles: ['admin', 'teacher', 'student'],
    submenu: [
      {
        title: 'All Courses',
        href: '/courses',
        icon: BookOpen,
        roles: ['admin', 'teacher', 'student'],
      },
      { title: 'Add Course', href: '/courses/new', icon: PlusCircle, roles: ['admin'] },
      { title: 'My Courses', href: '/courses/my-courses', icon: BookMarked, roles: ['student'] },
      { title: 'Enroll', href: '/courses/enroll', icon: UserPlus, roles: ['student'] },
      { title: 'Subjects', href: '/courses/subjects', icon: BookMarked, roles: ['admin'] },
    ],
  },
  {
    title: 'Batches',
    href: '/batches',
    icon: Calendar,
    roles: ['admin', 'teacher'],
  },
  {
    title: 'Fees',
    href: '/fees',
    icon: CurrencyIcon,
    roles: ['admin'],
    submenu: [
      { title: 'Collect Fees', href: '/fees/collect', icon: CreditCard, roles: ['admin'] },
      { title: 'Due Fees', href: '/fees/due', icon: FileText, roles: ['admin'] },
      { title: 'Payments', href: '/fees/payments', icon: CurrencyIcon, roles: ['admin'] },
      { title: 'Fee Structure', href: '/fees/structure', icon: BookMarked, roles: ['admin'] },
    ],
  },
  {
    title: 'My Fees',
    href: '/fees/my-fees',
    icon: CurrencyIcon,
    roles: ['student'],
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: ClipboardCheck,
    roles: ['admin', 'teacher'],
    submenu: [
      {
        title: 'Take Attendance',
        href: '/attendance',
        icon: ClipboardCheck,
        roles: ['admin', 'teacher'],
      },
      { title: 'Mark My Attendance', href: '/attendance/mark', icon: User, roles: ['teacher'] },
    ],
  },
  {
    title: 'Attendance',
    href: '/attendance/mark',
    icon: ClipboardCheck,
    roles: ['student'],
    submenu: [
      {
        title: 'Mark Attendance',
        href: '/attendance/mark',
        icon: ClipboardCheck,
        roles: ['student'],
      },
      {
        title: 'My Attendance',
        href: '/attendance/my-attendance',
        icon: Calendar,
        roles: ['student'],
      },
    ],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

function SidebarContent({ onClose, userRole }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState([]);

  const toggleSubmenu = (href) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href],
    );
  };

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');

  // Filter menu items based on user role
  const filteredMenuItems = menuItems
    .filter((item) => item.roles.includes(userRole))
    .map((item) => {
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter((sub) => sub.roles.includes(userRole)),
        };
      }
      return item;
    });

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">CH Management</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.href}>
                {item.submenu && item.submenu.length > 0 ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.href)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform',
                          expandedItems.includes(item.href) && 'rotate-180',
                        )}
                      />
                    </button>
                    {expandedItems.includes(item.href) && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={onClose}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                pathname === subItem.href
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              )}
                            >
                              <SubIcon className="w-4 h-4" />
                              {subItem.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />
      <div className="p-4">
        <p className="text-xs text-sidebar-foreground/50 text-center">CH Management System v1.0</p>
      </div>
    </div>
  );
}

function Header({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'default',
      teacher: 'secondary',
      student: 'outline',
    };
    return (
      <Badge variant={variants[role] || 'outline'} className="ml-2 text-xs capitalize">
        {role}
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background border-b flex items-center justify-between px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onClose={() => {}} userRole={user?.role || 'student'} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex items-center">
                <span className="text-sm font-medium">{user?.name || 'User'}</span>
                {getRoleBadge(user?.role)}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div>
                <p>{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground font-normal capitalize">{user?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {user?.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await response.json();
        // Combine user and profile data, ensuring role is included
        setUser({
          ...data.profile,
          ...data.user,
          name: data.profile?.name || data.user?.email?.split('@')[0] || 'User',
        });
      } catch (error) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 z-40 h-full w-64 border-r">
        <SidebarContent onClose={() => {}} userRole={user?.role || 'student'} />
      </aside>

      <div className="lg:ml-64">
        <Header user={user} />

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
