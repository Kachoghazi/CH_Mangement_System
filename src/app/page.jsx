'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  Users,
  CreditCard,
  BarChart3,
  ClipboardCheck,
  Calendar,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: GraduationCap,
    title: 'Student Management',
    description: 'Manage student admissions, profiles, and academic records efficiently.',
  },
  {
    icon: CreditCard,
    title: 'Fee Management',
    description: 'Track fee payments, generate invoices, and manage fee structures.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Generate comprehensive reports and gain insights from data.',
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance Tracking',
    description: 'Mark and monitor student and teacher attendance seamlessly.',
  },
  {
    icon: Calendar,
    title: 'Batch Management',
    description: 'Create and manage batches with schedules and assignments.',
  },
  {
    icon: Users,
    title: 'Teacher Management',
    description: 'Manage teacher profiles, subjects, and salary information.',
  },
];

const benefits = [
  'Easy to use interface',
  'Real-time data sync',
  'Secure and reliable',
  'Mobile responsive',
  'Comprehensive reports',
  'Quick setup',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-primary/10 to-background pointer-events-none" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <GraduationCap className="h-4 w-4" />
              Institute Management Made Easy
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">CH Management System</h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete Center/Institute Management System for coaching centers, academies, and
              educational institutions. Streamline your operations today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/login">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Login to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-8 text-sm text-muted-foreground">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools to manage every aspect of your educational institution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group hover:shadow-lg transition-all hover:border-primary/20"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 border-y">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
            <p className="text-muted-foreground">
              Join hundreds of institutes already using CH Management System.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 CH Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
