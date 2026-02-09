'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  BookMarked,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle,
  Hash,
  Clock,
} from 'lucide-react';

export default function SubjectsPage() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: '',
    totalClasses: '',
    courseId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, coursesRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/courses'),
      ]);

      const subjectsData = await subjectsRes.json();
      const coursesData = await coursesRes.json();

      if (subjectsRes.ok) {
        setSubjects(subjectsData.subjects || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const url = '/api/subjects';
      const method = editDialog.open ? 'PUT' : 'POST';
      const body = editDialog.open ? { id: editDialog.data._id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editDialog.open ? 'Subject updated successfully!' : 'Subject created successfully!',
        });
        fetchData();
        closeDialogs();
      } else {
        throw new Error(data.message || 'Operation failed');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/subjects?id=${deleteDialog.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Subject deleted successfully!' });
        fetchData();
        setDeleteDialog({ open: false, id: null, name: '' });
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (subject) => {
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      description: subject.description || '',
      credits: subject.credits?.toString() || '',
      totalClasses: subject.totalClasses?.toString() || '',
      courseId: subject.courseId || '',
    });
    setEditDialog({ open: true, data: subject });
  };

  const closeDialogs = () => {
    setAddDialog(false);
    setEditDialog({ open: false, data: null });
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: '',
      totalClasses: '',
      courseId: '',
    });
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      (subject.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (subject.code?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (filterCourse === 'all') return matchesSearch;
    return matchesSearch && subject.courseId === filterCourse;
  });

  // Group subjects by course
  const subjectsByCourse = filteredSubjects.reduce((acc, subject) => {
    const courseKey = subject.courseName || 'Uncategorized';
    if (!acc[courseKey]) acc[courseKey] = [];
    acc[courseKey].push(subject);
    return acc;
  }, {});

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage course subjects and curriculum</p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {/* Message Alert */}
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.reduce((sum, s) => sum + (s.credits || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Combined credit hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Courses Covered</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(subjectsByCourse).length}</div>
            <p className="text-xs text-muted-foreground">With subjects assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(subjectsByCourse).length === 0 ? (
            <div className="text-center py-12">
              <BookMarked className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No subjects found</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first subject</p>
              <Button onClick={() => setAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(subjectsByCourse).map(([courseName, courseSubjects]) => (
                <div key={courseName}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {courseName}
                    <Badge variant="secondary">{courseSubjects.length} subjects</Badge>
                  </h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Classes</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseSubjects.map((subject) => (
                          <TableRow key={subject._id}>
                            <TableCell>
                              <div className="font-medium">{subject.name}</div>
                              {subject.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {subject.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {subject.code ? (
                                <Badge variant="outline">{subject.code}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{subject.credits || 0}</TableCell>
                            <TableCell>{subject.totalClasses || 0}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(subject)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDeleteDialog({
                                        open: true,
                                        id: subject._id,
                                        name: subject.name,
                                      })
                                    }
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialog || editDialog.open} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editDialog.open ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <DialogDescription>
              {editDialog.open
                ? 'Update the subject details below'
                : 'Fill in the details to create a new subject'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="courseId">Course *</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, courseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., MATH101"
                />
              </div>
              <div>
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  min="0"
                  value={formData.credits}
                  onChange={(e) => setFormData((prev) => ({ ...prev, credits: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="totalClasses">Total Classes</Label>
                <Input
                  id="totalClasses"
                  type="number"
                  min="0"
                  value={formData.totalClasses}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, totalClasses: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Brief description of the subject..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formData.name || !formData.courseId}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editDialog.open ? 'Update Subject' : 'Add Subject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null, name: '' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, id: null, name: '' })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
