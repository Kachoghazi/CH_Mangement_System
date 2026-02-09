'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardCheck,
  Calendar,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export default function MyAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0,
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/my?month=${selectedMonth}`);
      const data = await response.json();

      if (response.ok) {
        const attendances = data.attendances || [];
        setAttendanceData(attendances);

        // Calculate stats
        const present = attendances.filter((a) => a.status === 'present').length;
        const absent = attendances.filter((a) => a.status === 'absent').length;
        const late = attendances.filter((a) => a.status === 'late').length;
        const total = attendances.length;
        const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        setStats({ present, absent, late, total, percentage });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (delta) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const getStatusBadge = (status) => {
    const config = {
      present: { variant: 'default', icon: Check, className: 'bg-emerald-100 text-emerald-700' },
      absent: { variant: 'destructive', icon: X, className: '' },
      late: { variant: 'secondary', icon: Clock, className: 'bg-amber-100 text-amber-700' },
      leave: { variant: 'outline', icon: Calendar, className: '' },
    };
    const { icon: Icon, className } = config[status] || config.absent;
    return (
      <Badge
        variant={config[status]?.variant || 'secondary'}
        className={`flex items-center gap-1 w-fit ${className}`}
      >
        <Icon className="h-3 w-3" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  // Generate calendar days for the selected month
  const generateCalendarDays = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const attendance = attendanceData.find(
        (a) => new Date(a.date).toISOString().split('T')[0] === dateStr,
      );
      days.push({
        date,
        day,
        dayOfWeek: date.getDay(),
        status: attendance?.status || null,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">View your attendance history and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <Check className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground">Days attended</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <X className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">Days missed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.late}</div>
            <p className="text-xs text-muted-foreground">Late arrivals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentage}%</div>
            <Progress value={stats.percentage} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[150px] text-center">
                {getMonthName(selectedMonth)}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMonth(1)}
                disabled={
                  selectedMonth >=
                  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: calendarDays[0]?.dayOfWeek || 0 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12" />
            ))}
            {calendarDays.map((day) => (
              <div
                key={day.day}
                className={`h-12 rounded-lg flex flex-col items-center justify-center text-sm ${
                  day.isWeekend
                    ? 'bg-muted/50 text-muted-foreground'
                    : day.status === 'present'
                      ? 'bg-emerald-100 text-emerald-700'
                      : day.status === 'absent'
                        ? 'bg-red-100 text-red-700'
                        : day.status === 'late'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-muted/30'
                }`}
              >
                <span className="font-medium">{day.day}</span>
                {day.status && !day.isWeekend && (
                  <span className="text-xs">
                    {day.status === 'present' ? '✓' : day.status === 'absent' ? '✗' : '⏰'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100" />
              <span className="text-sm text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100" />
              <span className="text-sm text-muted-foreground">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100" />
              <span className="text-sm text-muted-foreground">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/50" />
              <span className="text-sm text-muted-foreground">Weekend/Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Detailed attendance records for {getMonthName(selectedMonth)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceData.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No attendance records</h3>
              <p className="text-muted-foreground">
                No attendance has been recorded for this month yet
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked At</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((record) => (
                      <TableRow key={record._id}>
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          {record.markedAt ? new Date(record.markedAt).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
