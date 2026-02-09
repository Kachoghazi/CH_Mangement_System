'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Search,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';

export default function CollectFeesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    transactionId: '',
    remarks: '',
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSelectedStudent(null);
    setError('');

    try {
      const response = await fetch(
        `/api/students?search=${encodeURIComponent(searchQuery)}&limit=1`,
      );
      const data = await response.json();

      if (response.ok && data.students?.length > 0) {
        const student = data.students[0];
        setSelectedStudent({
          id: student._id,
          name: student.name,
          phone: student.phone,
          course: student.courseName || 'N/A',
          batch: student.batchCode || 'N/A',
          totalFee: student.totalFee || 0,
          paid: student.paidAmount || 0,
          pending: student.feesDue || 0,
        });
        setPaymentData((prev) => ({ ...prev, amount: (student.feesDue || 0).toString() }));
      } else {
        setError('No student found with the given name or phone number');
      }
    } catch (err) {
      setError('Error searching for student');
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (e) => {
    e.preventDefault();

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paymentData.paymentMethod !== 'cash' && !paymentData.transactionId) {
      setError('Please enter transaction ID for online payments');
      return;
    }

    setCollecting(true);
    setError('');

    try {
      const response = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId,
          remarks: paymentData.remarks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Payment collection failed');
      }
    } catch (err) {
      setError('Error collecting payment');
    } finally {
      setCollecting(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'bank_transfer', label: 'Transfer', icon: Smartphone },
  ];

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/fees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Successful</h1>
          </div>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Rs. {paymentData.amount} Collected</h2>
              <p className="text-muted-foreground">From {selectedStudent?.name}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{paymentData.paymentMethod}</span>
              </div>
              {paymentData.transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span>{paymentData.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-center pt-4">
              <Button variant="outline" onClick={() => window.print()}>
                <Receipt className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setSelectedStudent(null);
                  setSearchQuery('');
                  setPaymentData({
                    amount: '',
                    paymentMethod: 'cash',
                    transactionId: '',
                    remarks: '',
                  });
                }}
              >
                Collect Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collect Fees</h1>
          <p className="text-muted-foreground">Search for a student and collect payment</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Student</CardTitle>
          <CardDescription>Enter student name or phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Details & Payment */}
      {selectedStudent && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedStudent.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStudent.phone}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course:</span>
                  <span>{selectedStudent.course}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch:</span>
                  <span>{selectedStudent.batch}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Fee:</span>
                  <span>Rs. {(selectedStudent.totalFee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="text-green-600">
                    Rs. {(selectedStudent.paid || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Pending:</span>
                  <Badge variant="destructive">
                    Rs. {(selectedStudent.pending || 0).toLocaleString()}
                  </Badge>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Payment Progress</span>
                  <span>
                    {Math.round((selectedStudent.paid / selectedStudent.totalFee) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${(selectedStudent.paid / selectedStudent.totalFee) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCollect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (PKR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max payable: Rs. {(selectedStudent.pending || 0).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() =>
                          setPaymentData((prev) => ({ ...prev, paymentMethod: method.id }))
                        }
                        className={`p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-1 ${
                          paymentData.paymentMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <method.icon className="h-5 w-5" />
                        <span className="text-sm">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentData.paymentMethod !== 'cash' && (
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      placeholder="Enter transaction ID"
                      value={paymentData.transactionId}
                      onChange={(e) =>
                        setPaymentData((prev) => ({ ...prev, transactionId: e.target.value }))
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Input
                    id="remarks"
                    placeholder="Add any notes"
                    value={paymentData.remarks}
                    onChange={(e) =>
                      setPaymentData((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                  />
                </div>

                <Separator />

                <Button type="submit" className="w-full" size="lg" disabled={collecting}>
                  {collecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Collect Rs. {paymentData.amount || 0}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
