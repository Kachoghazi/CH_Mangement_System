'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Save,
  BookOpen,
  Clock,
  Banknote,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function AddCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    durationUnit: 'months',
    fee: '',
    admissionFee: '',
    category: '',
    subjects: '',
    eligibility: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name || !formData.duration) {
        throw new Error('Please fill in course name and duration');
      }

      const response = await axios.post('/api/courses', formData);
      if (response.status === 201) {
        router.push('/courses');
      } else {
        throw new Error('Failed to create course');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Programming',
    'Web Development',
    'Data Science',
    'Design',
    'Marketing',
    'Language',
    'Other',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Course</h1>
          <p className="text-muted-foreground">Create a new course for the institute</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Information</CardTitle>
              <CardDescription>Basic details about the course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    className="pl-10"
                    placeholder="e.g., Web Development Bootcamp"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="description"
                    name="description"
                    className="pl-10 min-h-[100px]"
                    placeholder="Brief description of the course"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eligibility">Eligibility</Label>
                <Input
                  id="eligibility"
                  name="eligibility"
                  placeholder="e.g., 10th pass, Graduate"
                  value={formData.eligibility}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Duration & Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Duration & Fees</CardTitle>
              <CardDescription>Course duration and fee structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      className="pl-10"
                      placeholder="e.g., 6"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationUnit">Unit</Label>
                  <select
                    id="durationUnit"
                    name="durationUnit"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.durationUnit}
                    onChange={handleChange}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="fee">Course Fee (Rs.)</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fee"
                    name="fee"
                    type="number"
                    className="pl-10"
                    placeholder="e.g., 25000"
                    value={formData.fee}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissionFee">Admission Fee (Rs.)</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admissionFee"
                    name="admissionFee"
                    type="number"
                    className="pl-10"
                    placeholder="e.g., 5000"
                    value={formData.admissionFee}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="subjects">Subjects (comma separated)</Label>
                <Textarea
                  id="subjects"
                  name="subjects"
                  className="min-h-[80px]"
                  placeholder="e.g., HTML, CSS, JavaScript, React"
                  value={formData.subjects}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="flex justify-end gap-4">
          <Link href="/courses">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
