'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CreditCard,
  GraduationCap,
  Shield,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setProfile(data.profile);
        setFormData({
          name: data.profile?.name || '',
          phone: data.profile?.phone || '',
          address: data.profile?.address || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile((prev) => ({ ...prev, ...formData }));
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setEditing(false);
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: { variant: 'default', icon: Shield },
      teacher: { variant: 'secondary', icon: GraduationCap },
      student: { variant: 'outline', icon: User },
    };
    const config = variants[role] || variants.student;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {role?.charAt(0).toUpperCase() + role?.slice(1)}
      </Badge>
    );
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U'
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(profile?.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{profile?.name || 'Unknown'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-2">{getRoleBadge(user?.role)}</div>

              {user?.role === 'student' && profile?.studentId && (
                <div className="mt-4 p-3 bg-muted rounded-lg w-full">
                  <p className="text-xs text-muted-foreground">Student ID</p>
                  <p className="font-mono font-semibold">{profile.studentId}</p>
                </div>
              )}

              {user?.role === 'teacher' && profile?.teacherId && (
                <div className="mt-4 p-3 bg-muted rounded-lg w-full">
                  <p className="text-xs text-muted-foreground">Teacher ID</p>
                  <p className="font-mono font-semibold">{profile.teacherId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your personal details and contact information</CardDescription>
            </div>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.name || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {editing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.phone || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="joined">Member Since</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Role-specific information */}
            {user?.role === 'student' && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold">Academic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Enrolled Course</p>
                      <p className="font-medium">{profile?.courseName || 'Not enrolled'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={profile?.status === 'active' ? 'default' : 'secondary'}>
                        {profile?.status || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}

            {user?.role === 'teacher' && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold">Employment Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Specialization</p>
                      <p className="font-medium">{profile?.specialization || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Employment Status</p>
                      <Badge
                        variant={profile?.employmentStatus === 'active' ? 'default' : 'secondary'}
                      >
                        {profile?.employmentStatus || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold">Admin Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile?.permissions || ['all']).map((perm, i) => (
                    <Badge key={i} variant="outline">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
