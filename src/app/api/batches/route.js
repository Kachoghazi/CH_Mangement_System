import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Batch from '@/models/Batch';
import { getCurrentUser } from '@/lib/auth';

// GET - List all batches
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const course = searchParams.get('course');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = { isActive: true };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (course) {
      query.courseId = course;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Batch.countDocuments(query);
    const batchesRaw = await Batch.find(query)
      .populate('courseId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform batches to include computed fields
    const batches = batchesRaw.map((b) => ({
      ...b,
      batchCode: b.code || b.name,
      courseName: b.courseId?.name || 'N/A',
      courseCode: b.courseId?.code || '',
      teacherName: b.teacherId?.name || 'Unassigned',
      maxStrength: b.maxStudents || 30,
      schedule: {
        ...b.schedule,
        timing:
          b.schedule?.startTime && b.schedule?.endTime
            ? `${b.schedule.startTime} - ${b.schedule.endTime}`
            : 'Not set',
      },
    }));

    return NextResponse.json({
      batches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ message: 'Error fetching batches' }, { status: 500 });
  }
}

// POST - Create new batch
export async function POST(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, courseId, teacherId, startDate, endDate, schedule, maxStudents, room } = data;

    if (!name || !courseId || !startDate) {
      return NextResponse.json(
        { message: 'Name, course, and start date are required' },
        { status: 400 },
      );
    }

    const batch = await Batch.create({
      name,
      courseId,
      teacherId: teacherId || undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      schedule: {
        days: schedule?.days || [],
        startTime: schedule?.startTime || '',
        endTime: schedule?.endTime || '',
        timezone: 'Asia/Karachi',
      },
      maxStudents: parseInt(maxStudents) || 30,
      room,
      status: new Date(startDate) > new Date() ? 'upcoming' : 'ongoing',
      isActive: true,
    });

    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'name code')
      .populate('teacherId', 'name');

    return NextResponse.json(
      {
        message: 'Batch created successfully',
        batch: populatedBatch,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { message: 'Error creating batch: ' + error.message },
      { status: 500 },
    );
  }
}
