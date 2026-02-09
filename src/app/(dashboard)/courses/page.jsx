'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Banknote,
  Clock,
  MoreHorizontal,
  Edit,
  Eye,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, coursesRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/courses'),
        ]);

        const userData = await userRes.json();
        const coursesData = await coursesRes.json();

        if (userRes.ok) {
          setUserRole(userData.user?.role);
        }

        if (coursesRes.ok) {
          setCourses(
            coursesData.courses?.map((c) => ({
              id: c._id,
              code: c.code || c.courseCode,
              name: c.name,
              durationMonths: c.durationMonths || 'N/A',
              durationUnit: c.durationUnit || 'months',
              totalFee: c.totalFee|| c.totalFee  || 0,
              students: c.studentCount || 0,
              status: c.isActive ? 'active' : 'inactive',
              description: c.description,
            })) || [],
          );
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCourses = courses.filter(
    (course) =>
      (course.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            {userRole === 'student'
              ? 'Browse available courses to enroll'
              : 'Manage all courses offered by your institute'}
          </p>
        </div>
        {userRole === 'admin' && (
          <Link href="/courses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </Link>
        )}
        {userRole === 'student' && (
          <Link href="/courses/enroll">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Enroll in Course
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card
            key={course.id}
            className="group hover:shadow-md transition-all hover:border-primary/20"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription>{course.code}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/courses/${course.id}`} className="flex items-center">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href={`/courses/${course.id}/edit`} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Course
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {userRole === 'student' && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/courses/enroll?course=${course.id}`}
                          className="flex items-center"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Enroll
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Duration
                  </div>
                  <span className="font-medium">{course.durationMonths} {course.durationUnit}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Banknote className="h-4 w-4" />
                    Fee
                  </div>
                  <span className="font-medium">Rs. {(course.totalFee || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Students
                  </div>
                  <span className="font-medium">{course.students}</span>
                </div>
                <div className="pt-2">
                  <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No courses found</p>
            <p className="text-sm">Try adjusting your search or add a new course</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
