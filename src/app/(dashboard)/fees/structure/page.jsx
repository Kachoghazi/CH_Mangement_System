'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  BookOpen,
  Banknote,
  Clock,
} from 'lucide-react';

export default function FeeStructurePage() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFeeStructures = async () => {
      try {
        const response = await fetch('/api/fees/structure');
        const data = await response.json();

        if (response.ok) {
          setFeeStructures(
            (data.structures || []).map((s) => ({
              id: s._id,
              course: s.course,
              code: s.code,
              duration: s.duration || 'N/A',
              admissionFee: s.admissionFee || 0,
              tuitionFee: s.tuitionFee || 0,
              totalFee: s.totalFee || 0,
              installments: s.installments || 1,
              status: s.status || 'active',
            })),
          );
        }
      } catch (error) {
        console.error('Error fetching fee structures:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeeStructures();
  }, []);

  const filteredStructures = feeStructures.filter((structure) =>
    (structure.course?.toLowerCase() || '').includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Structure</h1>
          <p className="text-muted-foreground">Manage course fee structures</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Structure
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeStructures.length}</div>
            <p className="text-xs text-muted-foreground">With fee structure</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Course Fee</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs.{' '}
              {feeStructures.length > 0
                ? Math.round(
                    feeStructures.reduce((sum, s) => sum + (s.totalFee || 0), 0) /
                      feeStructures.length,
                  ).toLocaleString()
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per course</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Structures</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeStructures.filter((s) => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Fee Structure Table */}
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
          ) : filteredStructures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No fee structures found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your search</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden sm:table-cell">Duration</TableHead>
                  <TableHead className="hidden md:table-cell">Admission Fee</TableHead>
                  <TableHead className="hidden md:table-cell">Tuition Fee</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead className="hidden lg:table-cell">Installments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStructures.map((structure) => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.course}</TableCell>
                    <TableCell className="hidden sm:table-cell">{structure.duration}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      Rs. {(structure.admissionFee || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      Rs. {(structure.tuitionFee || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      Rs. {(structure.totalFee || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{structure.installments}</TableCell>
                    <TableCell>
                      <Badge variant={structure.status === 'active' ? 'default' : 'secondary'}>
                        {structure.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
