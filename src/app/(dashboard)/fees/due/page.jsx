'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, AlertCircle, Phone, Send, Filter, Banknote } from 'lucide-react';

export default function DueFeesPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDays, setFilterDays] = useState('all');

  useEffect(() => {
    const fetchDueFees = async () => {
      try {
        const response = await fetch('/api/fees/due');
        const data = await response.json();

        if (response.ok) {
          setStudents(
            data.students?.map((f) => ({
              id: f._id || f.id,
              name: f.name,
              phone: f.phone || 'N/A',
              course: f.course || 'N/A',
              totalFee: f.totalFee || 0,
              paid: f.paidAmount || 0,
              pending: f.pendingAmount || 0,
              lastPayment: f.lastPaymentDate,
              dueDate: f.dueDate,
              overdueDays: f.overdueDays || 0,
            })) || [],
          );
        }
      } catch (error) {
        console.error('Error fetching due fees:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDueFees();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (student.phone || '').includes(searchQuery);

    if (filterDays === 'all') return matchesSearch;
    if (filterDays === 'overdue') return matchesSearch && student.overdueDays > 0;
    if (filterDays === '7')
      return matchesSearch && student.overdueDays > 0 && student.overdueDays <= 7;
    if (filterDays === '30')
      return matchesSearch && student.overdueDays > 0 && student.overdueDays <= 30;
    if (filterDays === '30+') return matchesSearch && student.overdueDays > 30;
    return matchesSearch;
  });

  const totalPending = students.reduce((sum, s) => sum + s.pending, 0);
  const overdueCount = students.filter((s) => s.overdueDays > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Due Fees</h1>
        <p className="text-muted-foreground">View and manage pending fee payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {students.length} students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Students with overdue fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month Due</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {Math.round(totalPending * 0.4).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Expected collections</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
          >
            <option value="all">All Pending</option>
            <option value="overdue">Overdue Only</option>
            <option value="7">Overdue {'<'} 7 days</option>
            <option value="30">Overdue {'<'} 30 days</option>
            <option value="30+">Overdue 30+ days</option>
          </select>
        </div>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Send Reminders
        </Button>
      </div>

      {/* Due Fees Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No due fees found</p>
              <p className="text-muted-foreground text-sm">All fees are up to date</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">Course</TableHead>
                  <TableHead className="hidden sm:table-cell">Total Fee</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {student.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{student.course}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Rs. {(student.totalFee || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      Rs. {(student.pending || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{student.dueDate}</TableCell>
                    <TableCell>
                      {student.overdueDays > 0 ? (
                        <Badge variant="destructive">{student.overdueDays} days overdue</Badge>
                      ) : (
                        <Badge variant="secondary">Upcoming</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm">Collect</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
