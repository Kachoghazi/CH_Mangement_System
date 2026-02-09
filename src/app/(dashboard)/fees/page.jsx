'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  CreditCard,
  Search,
  Banknote,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Download,
} from 'lucide-react';

export default function FeesPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    pending: 0,
    overdue: 0,
    thisMonth: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch payments and due fees in parallel
        const [paymentsRes, dueRes] = await Promise.all([
          fetch('/api/fees/payments?limit=5'),
          fetch('/api/fees/due?limit=5'),
        ]);

        const paymentsData = await paymentsRes.json();
        const dueData = await dueRes.json();

        if (paymentsRes.ok) {
          setStats({
            totalCollected: paymentsData.monthStats?.total || 0,
            pending: dueData.totalPending || 0,
            overdue: dueData.totalOverdue || 0,
            thisMonth: paymentsData.monthStats?.total || 0,
          });
          setRecentPayments(
            paymentsData.payments?.map((p) => ({
              id: p._id,
              student: p.studentName || 'N/A',
              studentId: p.studentId || 'N/A',
              amount: p.amount || 0,
              date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A',
              method: p.paymentMethod || 'Cash',
              status: p.status || 'completed',
            })) || [],
          );
        }

        if (dueRes.ok) {
          setPendingFees(
            dueData.fees?.map((f) => ({
              id: f._id,
              student: f.studentName || 'N/A',
              studentId: f.studentId || 'N/A',
              amount: f.pendingAmount || 0,
              dueDate: f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'N/A',
              course: f.courseName || 'N/A',
              daysLeft: -(f.overdueDays || 0),
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

  const statsCards = [
    {
      title: 'Total Collected',
      value: stats.totalCollected,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { title: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-600 bg-red-50' },
    {
      title: 'This Month',
      value: stats.thisMonth,
      icon: Banknote,
      color: 'text-blue-600 bg-blue-50',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground">Collect and track student fee payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/fees/collect">
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Collect Fee
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">Rs. {(stat.value || 0).toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Fees</TabsTrigger>
          <TabsTrigger value="recent">Recent Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Fee Payments</CardTitle>
              <CardDescription>Students with outstanding fee dues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden md:table-cell">Course</TableHead>
                      <TableHead>Amount Due</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{fee.student}</p>
                            <p className="text-sm text-muted-foreground">{fee.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{fee.course}</TableCell>
                        <TableCell className="font-medium text-destructive">
                          Rs. {(fee.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{fee.dueDate}</TableCell>
                        <TableCell>
                          {fee.daysLeft < 0 ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : fee.daysLeft <= 3 ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                              Due Soon
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/fees/collect?student=${fee.studentId}`}>
                            <Button size="sm">Collect</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Payments</CardTitle>
              <CardDescription>Latest fee collection transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.student}</p>
                            <p className="text-sm text-muted-foreground">{payment.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          +Rs. {(payment.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{payment.method}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
