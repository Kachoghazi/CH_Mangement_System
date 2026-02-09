'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function NewAdmissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',

    // Guardian Information
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',

    // Course Information
    courseId: '',
    batchId: '',

    // Fee Information
    totalFee: 0,
    admissionFee: 0,
    discount: 0,
    initialPayment: 0,
    paymentMethod: 'cash',

    // Additional
    previousEducation: '',
    notes: '',
  });

  useEffect(() => {
    // Fetch courses and batches
    const fetchData = async () => {
      try {
        const [coursesRes, batchesRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/batches'),
        ]);

        const coursesData = await coursesRes.json();
        const batchesData = await batchesRes.json();

        if (coursesRes.ok) {
          setCourses(
            coursesData.courses?.map((c) => ({
              id: c._id,
              name: c.name,
              totalFee: c.totalFee || 0,
              admissionFee: c.admissionFee || 0,
            })) || [],
          );
        }

        if (batchesRes.ok) {
          setBatches(
            batchesData.batches?.map((b) => ({
              id: b._id,
              name: b.batchCode || b.code || b.name,
              courseId: b.courseId?._id || b.courseId,
              schedule:
                b.schedule?.timing ||
                (b.schedule?.days?.length
                  ? `${b.schedule.days.map((d) => d.substring(0, 3)).join(', ')}${b.schedule.startTime ? ` | ${b.schedule.startTime} - ${b.schedule.endTime}` : ''}`
                  : 'Not scheduled'),
            })) || [],
          );
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // If course changes, update fees and reset batch
      if (name === 'courseId') {
        const selectedCourse = courses.find((c) => c.id === value);
        if (selectedCourse) {
          newData.totalFee = selectedCourse.totalFee;
          newData.admissionFee = selectedCourse.admissionFee;
          newData.batchId = '';
        }
      }

      return newData;
    });
    if (error) setError('');
  };

  const filteredBatches = batches.filter((b) => b.courseId === formData.courseId);

  const calculateTotalPayable = () => {
    return formData.totalFee - formData.discount;
  };

  const calculateDueAmount = () => {
    return calculateTotalPayable() - formData.initialPayment;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.name || !formData.phone || !formData.courseId) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create admission');
      }

      setSuccess('Admission created successfully!');

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/students');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Admission</h1>
          <p className="text-slate-600">Register a new student to the institute</p>
        </div>
        <Link href="/students">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details of the student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
            <CardDescription>Parent or guardian details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian Name</Label>
                <Input
                  id="guardianName"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  placeholder="Guardian's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Guardian Phone</Label>
                <Input
                  id="guardianPhone"
                  name="guardianPhone"
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  placeholder="Guardian's phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Relation</Label>
                <Select
                  value={formData.guardianRelation}
                  onValueChange={(value) => handleSelectChange('guardianRelation', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course & Batch Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course Selection</CardTitle>
            <CardDescription>Select course and batch for the student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course *</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) => handleSelectChange('courseId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} (Rs. {course.totalFee.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) => handleSelectChange('batchId', value)}
                  disabled={!formData.courseId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} | {batch.schedule}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fee Information</CardTitle>
            <CardDescription>Fee details and initial payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalFee">Total Fee</Label>
                <Input
                  id="totalFee"
                  name="totalFee"
                  type="number"
                  value={formData.totalFee}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  value={formData.discount}
                  onChange={handleChange}
                  min="0"
                  max={formData.totalFee}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Payable</Label>
                <Input
                  value={calculateTotalPayable()}
                  readOnly
                  className="bg-slate-50 font-semibold"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialPayment">Initial Payment</Label>
                <Input
                  id="initialPayment"
                  name="initialPayment"
                  type="number"
                  value={formData.initialPayment}
                  onChange={handleChange}
                  min="0"
                  max={calculateTotalPayable()}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleSelectChange('paymentMethod', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="easypaisa">Easypaisa</SelectItem>
                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Amount</Label>
                <Input
                  value={calculateDueAmount()}
                  readOnly
                  className={`bg-slate-50 font-semibold ${calculateDueAmount() > 0 ? 'text-red-600' : 'text-green-600'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="previousEducation">Previous Education</Label>
              <Input
                id="previousEducation"
                name="previousEducation"
                value={formData.previousEducation}
                onChange={handleChange}
                placeholder="e.g., 12th Grade, B.Sc. in Mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Link href="/students">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Admission'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
