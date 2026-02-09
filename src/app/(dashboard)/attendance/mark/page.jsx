'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LogIn,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function MarkAttendancePage() {
  const [user, setUser] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = today.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user info
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userRes.ok) {
          setUser(userData.user);
        }

        // Check if already marked today
        const todayStr = today.toISOString().split('T')[0];
        const attendanceRes = await fetch(`/api/attendance/my?date=${todayStr}`);
        const attendanceData = await attendanceRes.json();
        if (attendanceRes.ok && attendanceData.attendance) {
          setTodayAttendance(attendanceData.attendance);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markAttendance = async (status) => {
    setMarking(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today.toISOString().split('T')[0],
          status,
          markedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTodayAttendance({
          status,
          markedAt: new Date().toISOString(),
        });
        setSuccess('Attendance marked successfully!');
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError('An error occurred while marking attendance');
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground">Mark your attendance for today</p>
      </div>

      {/* Date and Time Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{formattedDate}</p>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Current Time: {currentTime}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {user?.role === 'student' ? 'Student' : 'Teacher'}
            </Badge>
          </div>
        </CardContent>
      </Card>

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

      {/* Attendance Status */}
      {todayAttendance ? (
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              Attendance Already Marked
            </CardTitle>
            <CardDescription className="text-emerald-600">
              You have already marked your attendance for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white">
              <div className="flex items-center gap-3">
                {todayAttendance.status === 'present' ? (
                  <div className="p-3 rounded-full bg-emerald-100">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                ) : (
                  <div className="p-3 rounded-full bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold capitalize">{todayAttendance.status}</p>
                  <p className="text-sm text-muted-foreground">
                    Marked at {new Date(todayAttendance.markedAt).toLocaleTimeString('en-PK')}
                  </p>
                </div>
              </div>
              <Badge variant={todayAttendance.status === 'present' ? 'default' : 'destructive'}>
                {todayAttendance.status === 'present' ? 'Present' : 'Absent'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Mark Your Attendance
            </CardTitle>
            <CardDescription>Select your attendance status for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => markAttendance('present')}
                disabled={marking}
                className="h-24 text-lg bg-emerald-600 hover:bg-emerald-700"
              >
                {marking ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-6 w-6" />
                )}
                Mark Present
              </Button>
              <Button
                onClick={() => markAttendance('absent')}
                disabled={marking}
                variant="destructive"
                className="h-24 text-lg"
              >
                {marking ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-6 w-6" />
                )}
                Mark Absent
              </Button>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-lg bg-muted text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Your attendance will be recorded with the current timestamp</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Week&apos;s Attendance</CardTitle>
          <CardDescription>Your attendance for the past 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...Array(7)].map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const isToday = i === 0;
              const dayName = date.toLocaleDateString('en-PK', { weekday: 'short' });
              const dayNum = date.getDate();

              // Mock data - In real app, fetch from API
              const status =
                isToday && todayAttendance
                  ? todayAttendance.status
                  : i === 0
                    ? null
                    : Math.random() > 0.2
                      ? 'present'
                      : 'absent';

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center p-3 rounded-lg border min-w-[60px] ${
                    isToday ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <span className="text-xs text-muted-foreground">{dayName}</span>
                  <span className="font-semibold">{dayNum}</span>
                  {status ? (
                    status === 'present' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-1" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-1" />
                    )
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-dashed border-muted-foreground mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
