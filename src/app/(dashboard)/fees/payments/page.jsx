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
import {
  Search,
  Download,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  TrendingUp,
  Calendar,
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [stats, setStats] = useState({ todayTotal: 0, monthTotal: 0 });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/fees/payments');
        const data = await response.json();

        if (response.ok) {
          setPayments(
            data.payments?.map((p) => ({
              id: p.paymentNumber || p._id,
              studentName: p.studentId?.name || 'N/A',
              course: p.studentId?.course || 'N/A',
              amount: p.studentId?.amount || 0,
              method: p.paymentMethod || 'cash',
              transactionId: p.transactionId,
              date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A',
              time: p.paymentDate ? new Date(p.paymentDate).toLocaleTimeString() : '',
              receivedBy: p.receivedBy || 'Admin',
            })) || [],
          );
          setStats({
            todayTotal: data.todayStats?.total || 0,
            monthTotal: data.monthStats?.total || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      (payment.studentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (payment.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (filterMethod === 'all') return matchesSearch;
    return matchesSearch && payment.method === filterMethod;
  });

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getMethodBadge = (method) => {
    const variants = {
      cash: 'default',
      card: 'secondary',
      upi: 'outline',
    };
    return (
      <Badge variant={variants[method]} className="gap-1">
        {getMethodIcon(method)}
        <span className="capitalize">{method}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">View all fee payment transactions</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs. {(stats.todayTotal || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Recent transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {(stats.monthTotal || totalCollected).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{payments.length} payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Payment</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs.{' '}
              {payments.length > 0
                ? Math.round(totalCollected / payments.length).toLocaleString()
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student or payment ID..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Method</TableHead>
                  <TableHead className="hidden lg:table-cell">Date & Time</TableHead>
                  <TableHead className="w-16">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                    <TableCell>
                      <p className="font-medium">{payment.studentName}</p>
                      {payment.transactionId && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {payment.transactionId}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{payment.course}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      Rs. {(payment.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getMethodBadge(payment.method)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div>
                        <p className="text-sm">{payment.date}</p>
                        <p className="text-xs text-muted-foreground">{payment.time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Receipt className="h-4 w-4" />
                      </Button>
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
