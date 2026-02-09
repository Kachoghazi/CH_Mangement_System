'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UserCheck,
  UserX,
  GraduationCap,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
} from 'lucide-react';

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [studentApplications, setStudentApplications] = useState([]);
  const [teacherApplications, setTeacherApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Dialog states
  const [viewDialog, setViewDialog] = useState({ open: false, data: null, type: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null, type: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const [studentsRes, teachersRes] = await Promise.all([
        fetch('/api/approvals/students'),
        fetch('/api/approvals/teachers'),
      ]);

      const studentsData = await studentsRes.json();
      const teachersData = await teachersRes.json();

      if (studentsRes.ok) {
        setStudentApplications(studentsData.applications || []);
      }
      if (teachersRes.ok) {
        setTeacherApplications(teachersData.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, type) => {
    setProcessing(id);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/approvals/${type}s/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `${type === 'student' ? 'Student' : 'Teacher'} approved successfully!`,
        });
        fetchApplications();
      } else {
        throw new Error(data.message || 'Failed to approve');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.id) return;

    setProcessing(rejectDialog.id);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(
        `/api/approvals/${rejectDialog.type}s/${rejectDialog.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `${rejectDialog.type === 'student' ? 'Student' : 'Teacher'} application rejected.`,
        });
        setRejectDialog({ open: false, id: null, type: null });
        setRejectReason('');
        fetchApplications();
      } else {
        throw new Error(data.message || 'Failed to reject');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const filteredStudents = studentApplications.filter(
    (app) =>
      (app.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.phone || '').includes(searchTerm),
  );

  const filteredTeachers = teacherApplications.filter(
    (app) =>
      (app.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.phone || '').includes(searchTerm),
  );

  const getStatusBadge = (status) => {
    const config = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    };
    const { variant, icon: Icon } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const pendingStudents = studentApplications.filter((a) => a.status === 'pending').length;
  const pendingTeachers = teacherApplications.filter((a) => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">Review and approve student and teacher applications</p>
      </div>

      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Students</p>
                <p className="text-2xl font-bold">{pendingStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Teachers</p>
                <p className="text-2xl font-bold">{pendingTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{pendingStudents + pendingTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Students
            {pendingStudents > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingStudents}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Teachers
            {pendingTeachers > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingTeachers}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Applications</CardTitle>
              <CardDescription>Review pending student registration requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead className="hidden lg:table-cell">Applied On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>{app.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{app.phone || 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell className="text-right">
                          {app.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setViewDialog({ open: true, data: app, type: 'student' })
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(app._id, 'student')}
                                disabled={processing === app._id}
                              >
                                {processing === app._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setRejectDialog({ open: true, id: app._id, type: 'student' })
                                }
                                disabled={processing === app._id}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {app.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="text-muted-foreground">
                            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No student applications found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teacher Applications</CardTitle>
              <CardDescription>Review pending teacher registration requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead className="hidden lg:table-cell">Applied On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>{app.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{app.phone || 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            app.employmentStatus === 'inactive' ? 'pending' : 'approved',
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {app.employmentStatus === 'inactive' ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setViewDialog({ open: true, data: app, type: 'teacher' })
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(app._id, 'teacher')}
                                disabled={processing === app._id}
                              >
                                {processing === app._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setRejectDialog({ open: true, id: app._id, type: 'teacher' })
                                }
                                disabled={processing === app._id}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Approved</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTeachers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No teacher applications found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog
        open={viewDialog.open}
        onOpenChange={(open) => setViewDialog({ open, data: null, type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {viewDialog.type === 'student' ? 'Student' : 'Teacher'} application information
            </DialogDescription>
          </DialogHeader>
          {viewDialog.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{viewDialog.data.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {viewDialog.data.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {viewDialog.data.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applied On</p>
                  <p className="font-medium">
                    {viewDialog.data.createdAt
                      ? new Date(viewDialog.data.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {viewDialog.type === 'student' && viewDialog.data.courseName && (
                <div>
                  <p className="text-sm text-muted-foreground">Requested Course</p>
                  <p className="font-medium">{viewDialog.data.courseName}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDialog({ open: false, data: null, type: null })}
            >
              Close
            </Button>
            {viewDialog.data?.status === 'pending' && (
              <Button
                onClick={() => {
                  handleApprove(viewDialog.data._id, viewDialog.type);
                  setViewDialog({ open: false, data: null, type: null });
                }}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          setRejectDialog({ open, id: null, type: null });
          setRejectReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>Please provide a reason for rejection (optional)</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, id: null, type: null });
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
