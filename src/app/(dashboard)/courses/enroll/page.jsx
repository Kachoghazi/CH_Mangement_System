'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Clock,
  Users,
  Banknote,
  CheckCircle,
  Loader2,
  AlertCircle,
  Calendar,
  GraduationCap,
} from 'lucide-react';

export default function CourseEnrollPage() {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available courses
        const coursesRes = await fetch('/api/courses');
        const coursesData = await coursesRes.json();
        if (coursesRes.ok) {
          setCourses(coursesData.courses || []);
        }

        // Fetch student's enrolled courses
        const enrolledRes = await fetch('/api/students/me/enrollments');
        const enrolledData = await enrolledRes.json();
        if (enrolledRes.ok) {
          setEnrolledCourses(enrolledData.enrollments?.map((e) => e.courseId) || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const enrollInCourse = async (courseId) => {
    setEnrolling(courseId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/students/me/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (response.ok) {
        setEnrolledCourses([...enrolledCourses, courseId]);
        setSuccess('Enrollment request submitted! Waiting for admin approval.');
      } else {
        setError(data.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      setError('An error occurred while enrolling');
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (courseId) => enrolledCourses.includes(courseId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Course Enrollment</h1>
        <p className="text-muted-foreground">Browse and enroll in available courses</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">How Enrollment Works</p>
              <p className="text-sm text-blue-700">
                Select a course to request enrollment. Your request will be reviewed by an admin who
                will assign you to an appropriate batch.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course._id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                {course.code && <Badge variant="secondary">{course.code}</Badge>}
              </div>
              <CardTitle className="mt-4">{course.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {course.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{course.durationMonths} months</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Banknote className="h-4 w-4" />
                  <span>Rs. {course.totalFee?.toLocaleString() || 0}</span>
                </div>
                {course.category && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{course.category}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                {isEnrolled(course._id) ? (
                  <Button disabled className="w-full" variant="secondary">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Enrolled / Pending
                  </Button>
                ) : (
                  <Button
                    onClick={() => enrollInCourse(course._id)}
                    disabled={enrolling === course._id}
                    className="w-full"
                  >
                    {enrolling === course._id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GraduationCap className="mr-2 h-4 w-4" />
                    )}
                    Enroll Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium">No Courses Available</p>
            <p className="text-muted-foreground">Check back later for new course offerings</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
