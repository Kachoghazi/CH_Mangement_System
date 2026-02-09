'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  MapPin,
  User,
} from 'lucide-react';
import Link from 'next/link';

export default function MyCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/students/me/enrollments');
      const data = await response.json();

      if (response.ok) {
        setEnrollments(data.enrollments || []);
        // Set the first active course as current
        const active = (data.enrollments || []).find((e) => e.status === 'active');
        setCurrentCourse(active || null);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { variant: 'default', className: 'bg-emerald-100 text-emerald-700' },
      pending: { variant: 'secondary', className: 'bg-amber-100 text-amber-700' },
      completed: { variant: 'outline', className: '' },
      dropped: { variant: 'destructive', className: '' },
    };
    const { variant, className } = config[status] || config.pending;
    return (
      <Badge variant={variant} className={className}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const activeEnrollments = enrollments.filter((e) => e.status === 'active');
  const pendingEnrollments = enrollments.filter((e) => e.status === 'pending');
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">View your enrolled courses and progress</p>
        </div>
        <Button asChild>
          <Link href="/courses/enroll">
            <BookOpen className="mr-2 h-4 w-4" />
            Enroll in Course
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">Courses finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Course */}
      {currentCourse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Course</CardTitle>
                <CardDescription>Your primary active enrollment</CardDescription>
              </div>
              {getStatusBadge(currentCourse.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{currentCourse.courseName}</h3>
                {currentCourse.courseCode && (
                  <Badge variant="outline" className="mb-4">
                    {currentCourse.courseCode}
                  </Badge>
                )}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {currentCourse.batchName && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Batch: {currentCourse.batchName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Enrolled:{' '}
                      {currentCourse.enrolledAt
                        ? new Date(currentCourse.enrolledAt).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <Separator orientation="vertical" className="hidden md:block" />
              <div className="md:w-48">
                <p className="text-sm text-muted-foreground mb-2">Quick Actions</p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/attendance/my-attendance">View Attendance</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/fees/my-fees">View Fees</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>All Enrollments</CardTitle>
          <CardDescription>Complete history of your course enrollments</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No enrollments yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by enrolling in your first course
              </p>
              <Button asChild>
                <Link href="/courses/enroll">Browse Courses</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.map((enrollment, index) => (
                <Card key={enrollment.courseId || index} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{enrollment.courseName || 'Course'}</h4>
                        {enrollment.courseCode && (
                          <Badge variant="outline" className="mt-1">
                            {enrollment.courseCode}
                          </Badge>
                        )}
                      </div>
                      {getStatusBadge(enrollment.status)}
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {enrollment.batchName && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Batch: {enrollment.batchName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {enrollment.status === 'pending'
                            ? `Requested: ${
                                enrollment.requestedAt
                                  ? new Date(enrollment.requestedAt).toLocaleDateString()
                                  : 'N/A'
                              }`
                            : `Enrolled: ${
                                enrollment.enrolledAt
                                  ? new Date(enrollment.enrolledAt).toLocaleDateString()
                                  : 'N/A'
                              }`}
                        </span>
                      </div>
                    </div>
                    {enrollment.status === 'pending' && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-700">Waiting for admin approval</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
