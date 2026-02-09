import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { getCurrentUser } from '@/lib/auth';

// Default settings
const defaultSettings = {
  instituteName: 'CH Academy',
  instituteCode: 'CHA-001',
  email: 'admin@chacademy.com',
  phone: '+92 300 0000000',
  address: '123 Education Street, Islamabad',
  website: 'https://chacademy.pk',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  timezone: 'Asia/Karachi',
  newAdmissionNotification: true,
  feePaymentNotification: true,
  dueReminderNotification: true,
  attendanceAlertNotification: true,
};

// GET - Get settings
export async function GET(request) {
  try {
    await dbConnect();

    const allSettings = await Settings.find({});

    // Build settings object from key-value pairs
    const settings = { ...defaultSettings };
    allSettings.forEach((setting) => {
      settings[setting.key] = setting.value;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Error fetching settings' }, { status: 500 });
  }
}

// PUT - Update settings
export async function PUT(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Update each setting
    for (const [key, value] of Object.entries(data)) {
      await Settings.set(key, value, { category: 'general' });
    }

    // Return updated settings
    const allSettings = await Settings.find({});
    const settings = { ...defaultSettings };
    allSettings.forEach((setting) => {
      settings[setting.key] = setting.value;
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ message: 'Error updating settings' }, { status: 500 });
  }
}
