'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardCheck,
  Calendar,
  Users,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
} from 'lucide-react';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch('/api/batches');
        const data = await response.json();
        if (response.ok && data.batches?.length > 0) {
          setBatches(data.batches);
          setSelectedBatch(data.batches[0]._id);
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Fetch students when batch or date changes
  useEffect(() => {
    if (!selectedBatch) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/attendance?batchId=${selectedBatch}&date=${selectedDate}`,
        );
        const data = await response.json();

        if (response.ok) {
          setStudents(data.students || []);
          // Initialize attendance state
          const attendanceMap = {};
          data.students?.forEach((s) => {
            attendanceMap[s._id] = s.attendanceStatus || null;
          });
          setAttendance(attendanceMap);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedBatch, selectedDate]);

  const markAttendance = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    setAttendance(students.reduce((acc, s) => ({ ...acc, [s._id]: 'present' }), {}));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status: status || 'absent',
      }));

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatch,
          date: selectedDate,
          attendance: attendanceRecords,
        }),
      });

      if (response.ok) {
        alert('Attendance saved successfully!');
      } else {
        alert('Error saving attendance');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    present: Object.values(attendance).filter((v) => v === 'present').length,
    absent: Object.values(attendance).filter((v) => v === 'absent').length,
    late: Object.values(attendance).filter((v) => v === 'late').length,
    unmarked: Object.values(attendance).filter((v) => v === null).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Mark and manage student attendance</p>
        </div>
        <Button onClick={saveAttendance} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Attendance
        </Button>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Student Attendance</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.batchCode || b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" onClick={markAllPresent}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.present}</p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600">
                    <X className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.absent}</p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.late}</p>
                    <p className="text-sm text-muted-foreground">Late</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.unmarked}</p>
                    <p className="text-sm text-muted-foreground">Unmarked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Students -{' '}
                {batches.find((b) => b._id === selectedBatch)?.batchCode || 'Select Batch'}
              </CardTitle>
              <CardDescription>Mark attendance for each student</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students found in this batch</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium text-primary">
                            {(student.name || 'S').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.studentId}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={attendance[student._id] === 'present' ? 'default' : 'outline'}
                          className={
                            attendance[student._id] === 'present'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : ''
                          }
                          onClick={() => markAttendance(student._id, 'present')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student._id] === 'absent' ? 'default' : 'outline'}
                          className={
                            attendance[student._id] === 'absent'
                              ? 'bg-red-600 hover:bg-red-700'
                              : ''
                          }
                          onClick={() => markAttendance(student._id, 'absent')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student._id] === 'late' ? 'default' : 'outline'}
                          className={
                            attendance[student._id] === 'late'
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : ''
                          }
                          onClick={() => markAttendance(student._id, 'late')}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Teacher Attendance</p>
              <p className="text-sm">Select a date to mark teacher attendance</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
