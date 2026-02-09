'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Banknote,
  Calendar,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export default function MyFeesPage() {
  const [loading, setLoading] = useState(true);
  const [feeSummary, setFeeSummary] = useState({
    totalFee: 0,
    totalPaid: 0,
    totalPending: 0,
    nextDueDate: null,
  });
  const [payments, setPayments] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);

  useEffect(() => {
    fetchFeeData();
  }, []);

  const fetchFeeData = async () => {
    try {
      const response = await fetch('/api/fees/my-fees');
      const data = await response.json();

      if (response.ok) {
        setFeeSummary({
          totalFee: data.summary?.totalFee || 0,
          totalPaid: data.summary?.totalPaid || 0,
          totalPending: data.summary?.totalPending || 0,
          nextDueDate: data.summary?.nextDueDate,
        });
        setPayments(data.payments || []);
        setPendingInvoices(data.pendingInvoices || []);
      }
    } catch (error) {
      console.error('Error fetching fee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (paymentId) => {
    try {
      window.open(`/api/fees/receipt/${paymentId}`, '_blank');
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const statsCards = [
    {
      title: 'Total Course Fee',
      value: `Rs. ${feeSummary.totalFee.toLocaleString()}`,
      icon: Banknote,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Total Paid',
      value: `Rs. ${feeSummary.totalPaid.toLocaleString()}`,
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Pending Amount',
      value: `Rs. ${feeSummary.totalPending.toLocaleString()}`,
      icon: Clock,
      color:
        feeSummary.totalPending > 0
          ? 'text-amber-600 bg-amber-50'
          : 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Next Due Date',
      value: feeSummary.nextDueDate
        ? new Date(feeSummary.nextDueDate).toLocaleDateString()
        : 'No dues',
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Fees</h1>
        <p className="text-muted-foreground">View your fee status and payment history</p>
      </div>

      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Invoices Alert */}
      {feeSummary.totalPending > 0 && (
        <Alert variant="default" className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have Rs. {feeSummary.totalPending.toLocaleString()} in pending fees. Please contact
            the admin office to make a payment.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Pending Payments
            </CardTitle>
            <CardDescription>Fee installments that are due</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvoices.length > 0 ? (
              <div className="space-y-3">
                {pendingInvoices.map((invoice, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invoice.description || 'Course Fee'}</p>
                      <p className="text-sm text-muted-foreground">
                        Due:{' '}
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-600">
                        Rs. {(invoice.amount || 0).toLocaleString()}
                      </p>
                      <Badge variant={invoice.isOverdue ? 'destructive' : 'secondary'}>
                        {invoice.isOverdue ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                <p>No pending payments!</p>
                <p className="text-sm">All your fees are up to date.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Payment History
            </CardTitle>
            <CardDescription>Your previous fee payments</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.description || 'Fee Payment'}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString()
                          : 'N/A'}
                        {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">
                          Rs. {(payment.amount || 0).toLocaleString()}
                        </p>
                        <Badge variant="default">Paid</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadReceipt(payment._id)}
                        title="Download Receipt"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No payment history</p>
                <p className="text-sm">Your payments will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Note */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">About Fee Payments</p>
              <p className="text-sm text-muted-foreground">
                Fee payments are collected by the admin office only. Please visit the office or
                contact the admin to make your fee payment. Cash, online transfer, and other payment
                methods are accepted.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
