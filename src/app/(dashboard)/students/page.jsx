'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserPlus,
  Search,
  Filter,
  Eye,
  CreditCard,
  MoreHorizontal,
  Download,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user info, students and courses in parallel
        const [userRes, studentsRes, coursesRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/students'),
          fetch('/api/courses'),
        ]);

        const userData = await userRes.json();
        const studentsData = await studentsRes.json();
        const coursesData = await coursesRes.json();

        if (userRes.ok) {
          setUserRole(userData.user?.role);
        }
        if (studentsRes.ok) {
          setStudents(studentsData.students || []);
        }
        if (coursesRes.ok) {
          setCourses(coursesData.courses || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (student.studentId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (student.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesCourse =
      courseFilter === 'all' ||
      student.courseName === courseFilter ||
      student.course === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      passed: 'outline',
      dropped: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || courseFilter !== 'all';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            {userRole === 'admin'
              ? 'Manage all students in your institute'
              : 'View students assigned to you'}
          </p>
        </div>
        <div className="flex gap-2">
          {userRole === 'admin' && (
            <>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Link href="/students/new">
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  New Admission
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID or phone..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="passed">Passed</option>
              <option value="dropped">Dropped</option>
            </select>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course.name}>
                  {course.name}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCourseFilter('all');
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            All Students
            <Badge variant="secondary" className="ml-2">
              {filteredStudents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Course</TableHead>
                  <TableHead className="hidden lg:table-cell">Batch</TableHead>
                  {userRole === 'admin' && <TableHead>Fees Due</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student._id || student.id}>
                    <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{student.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {student.courseName || student.course}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {student.batchCode || student.batch}
                    </TableCell>
                    {userRole === 'admin' && (
                      <TableCell>
                        <span
                          className={
                            (student.feesDue || 0) > 0
                              ? 'text-destructive font-medium'
                              : 'text-emerald-600'
                          }
                        >
                          Rs. {(student.feesDue || 0).toLocaleString()}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/students/${student._id || student.id}`}
                              className="flex items-center"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {userRole === 'admin' && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/fees/collect?student=${student._id || student.id}`}
                                className="flex items-center"
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Collect Fee
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={userRole === 'admin' ? 8 : 7} className="text-center py-12">
                      <div className="text-muted-foreground">
                        <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No students found matching your criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
