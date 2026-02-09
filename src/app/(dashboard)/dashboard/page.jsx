'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap,
  Users,
  BookOpen,
  Banknote,
  UserPlus,
  CreditCard,
  ClipboardCheck,
  Calendar,
  BarChart3,
  Settings,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  LogIn,
} from 'lucide-react';

// Admin stats cards
const adminStatsCards = [
  {
    title: 'Total Students',
    key: 'students',
    icon: GraduationCap,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-700',
    link: '/students',
    trend: '+12%',
    trendUp: true,
  },
  {
    title: 'Total Teachers',
    key: 'teachers',
    icon: Users,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-700',
    link: '/teachers',
    trend: '+3',
    trendUp: true,
  },
  {
    title: 'Active Courses',
    key: 'courses',
    icon: BookOpen,
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-700',
    link: '/courses',
    trend: '2 new',
    trendUp: true,
  },
  {
    title: "Today's Collection",
    key: 'collection',
    icon: Banknote,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-700',
    link: '/fees',
    prefix: 'Rs. ',
    trend: '+18%',
    trendUp: true,
  },
];

// Student stats cards
const studentStatsCards = [
  {
    title: 'My Courses',
    key: 'enrolledCourses',
    icon: BookOpen,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-700',
    link: '/courses/my-courses',
  },
  {
    title: 'Attendance',
    key: 'attendancePercent',
    icon: ClipboardCheck,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-700',
    link: '/attendance/my-attendance',
    suffix: '%',
  },
  {
    title: 'Pending Fees',
    key: 'pendingFees',
    icon: Banknote,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-700',
    link: '/fees/my-fees',
    prefix: 'Rs. ',
  },
  {
    title: 'Upcoming Classes',
    key: 'upcomingClasses',
    icon: Calendar,
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-700',
    link: '/schedule',
  },
];

// Teacher stats cards
const teacherStatsCards = [
  {
    title: 'My Batches',
    key: 'myBatches',
    icon: Users,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-700',
    link: '/batches',
  },
  {
    title: 'Total Students',
    key: 'totalStudents',
    icon: GraduationCap,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-700',
    link: '/students',
  },
  {
    title: 'Classes Today',
    key: 'classesToday',
    icon: Calendar,
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-700',
    link: '/schedule',
  },
  {
    title: 'Attendance Rate',
    key: 'attendanceRate',
    icon: ClipboardCheck,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-700',
    link: '/attendance',
    suffix: '%',
  },
];

// Admin quick actions
const adminQuickActions = [
  { title: 'New Admission', href: '/students/new', icon: UserPlus, color: 'text-blue-600' },
  { title: 'Collect Fee', href: '/fees/collect', icon: CreditCard, color: 'text-emerald-600' },
  { title: 'Take Attendance', href: '/attendance', icon: ClipboardCheck, color: 'text-violet-600' },
  { title: 'Create Batch', href: '/batches/new', icon: Calendar, color: 'text-orange-600' },
  { title: 'View Reports', href: '/reports', icon: BarChart3, color: 'text-pink-600' },
  { title: 'Settings', href: '/settings', icon: Settings, color: 'text-slate-600' },
];

// Student quick actions
const studentQuickActions = [
  { title: 'Mark Attendance', href: '/attendance/mark', icon: LogIn, color: 'text-emerald-600' },
  { title: 'Enroll Course', href: '/courses/enroll', icon: BookOpen, color: 'text-blue-600' },
  { title: 'My Profile', href: '/profile', icon: Users, color: 'text-violet-600' },
  { title: 'View Schedule', href: '/schedule', icon: Calendar, color: 'text-orange-600' },
];

// Teacher quick actions
const teacherQuickActions = [
  { title: 'Mark Attendance', href: '/attendance/mark', icon: LogIn, color: 'text-emerald-600' },
  { title: 'Take Attendance', href: '/attendance', icon: ClipboardCheck, color: 'text-blue-600' },
  { title: 'My Batches', href: '/batches', icon: Users, color: 'text-violet-600' },
  { title: 'View Schedule', href: '/schedule', icon: Calendar, color: 'text-orange-600' },
  { title: 'My Profile', href: '/profile', icon: Users, color: 'text-pink-600' },
];

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    collection: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // First fetch user info
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userRes.ok) {
          setUser(userData.user);
        }

        // Fetch dashboard stats based on role
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();

        if (response.ok) {
          setStats(data.stats);
          setRecentPayments(data.recentPayments || []);

          // Only fetch pending fees for admin
          if (userData.user?.role === 'admin') {
            const dueResponse = await fetch('/api/fees/due?limit=3');
            const dueData = await dueResponse.json();
            if (dueResponse.ok) {
              setPendingFees(dueData.fees || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Get role-based configurations
  const userRole = user?.role || 'admin';
  const statsCards =
    userRole === 'student'
      ? studentStatsCards
      : userRole === 'teacher'
        ? teacherStatsCards
        : adminStatsCards;
  const quickActions =
    userRole === 'student'
      ? studentQuickActions
      : userRole === 'teacher'
        ? teacherQuickActions
        : adminQuickActions;

  const getWelcomeMessage = () => {
    switch (userRole) {
      case 'student':
        return "Welcome back! Here's your learning progress.";
      case 'teacher':
        return "Welcome back! Here's your teaching overview.";
      default:
        return "Welcome back! Here's an overview of your institute.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {userRole === 'student'
              ? 'Student Dashboard'
              : userRole === 'teacher'
                ? 'Teacher Dashboard'
                : 'Admin Dashboard'}
          </h1>
          <p className="text-muted-foreground">{getWelcomeMessage()}</p>
        </div>
        {userRole === 'admin' && (
          <Link href="/students/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              New Admission
            </Button>
          </Link>
        )}
        {userRole === 'student' && (
          <Link href="/attendance/mark">
            <Button>
              <LogIn className="mr-2 h-4 w-4" />
              Mark Attendance
            </Button>
          </Link>
        )}
        {userRole === 'teacher' && (
          <Link href="/attendance">
            <Button>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Take Attendance
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.key} href={card.link}>
              <Card className="hover:shadow-md transition-all hover:border-primary/20 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p className="text-3xl font-bold tracking-tight">
                        {card.prefix || ''}
                        {stats[card.key]?.toLocaleString() || 0}
                        {card.suffix || ''}
                      </p>
                      {card.trend && (
                        <div className="flex items-center gap-1">
                          {card.trendUp ? (
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span
                            className={`text-xs font-medium ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {card.trend}
                          </span>
                          <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-xl ${card.lightColor} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid gap-3 ${
              userRole === 'admin'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent hover:border-primary/20 transition-all group"
                >
                  <div
                    className={`p-2 rounded-lg bg-muted group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-center">{action.title}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Admin: Recent Payments and Pending Fees */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Recent Payments</CardTitle>
                <CardDescription>Latest fee collections</CardDescription>
              </div>
              <Link href="/fees/payments">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Banknote className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{payment.student}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">
                          +Rs. {payment.amount?.toLocaleString()}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No recent payments</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Fees */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Pending Fees</CardTitle>
                <CardDescription>Students with due payments</CardDescription>
              </div>
              <Link href="/fees/due">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingFees.length > 0 ? (
                  pendingFees.map((fee) => (
                    <div
                      key={fee.id || fee._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{fee.studentName || fee.student}</p>
                          <p className="text-xs text-muted-foreground">
                            {fee.courseName || fee.course}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          Rs. {(fee.pendingAmount || fee.amount)?.toLocaleString()}
                        </p>
                        <Badge
                          variant={fee.overdueDays > 0 ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {fee.overdueDays > 0 ? `${fee.overdueDays} days overdue` : 'Due'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No pending fees</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student: My Courses and Attendance Info */}
      {userRole === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Enrolled Courses</CardTitle>
              <CardDescription>Courses you are currently enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.enrolledCoursesList?.length > 0 ? (
                  stats.enrolledCoursesList.map((course, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{course.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.batchName || 'No batch'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{course.status || 'Active'}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">No courses enrolled</p>
                    <Link href="/courses/enroll">
                      <Button size="sm">Enroll Now</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Summary</CardTitle>
              <CardDescription>Your attendance this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-700">Present Days</p>
                      <p className="text-sm text-emerald-600">{stats.presentDays || 0} days</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-700">Absent Days</p>
                      <p className="text-sm text-red-600">{stats.absentDays || 0} days</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teacher: My Batches and Today's Schedule */}
      {userRole === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Batches</CardTitle>
              <CardDescription>Batches you are teaching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.myBatchesList?.length > 0 ? (
                  stats.myBatchesList.map((batch, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{batch.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {batch.studentCount || 0} students
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{batch.schedule || 'N/A'}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No batches assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s Classes</CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.todayClasses?.length > 0 ? (
                  stats.todayClasses.map((cls, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cls.batchName}</p>
                          <p className="text-xs text-muted-foreground">{cls.time}</p>
                        </div>
                      </div>
                      <Badge variant={cls.completed ? 'secondary' : 'default'}>
                        {cls.completed ? 'Completed' : 'Upcoming'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No classes scheduled for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Placeholder - Admin Only */}
      {userRole === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Overview</CardTitle>
            <CardDescription>Admissions and revenue trends for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Chart Coming Soon</p>
                <p className="text-sm">Monthly revenue and admission trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
