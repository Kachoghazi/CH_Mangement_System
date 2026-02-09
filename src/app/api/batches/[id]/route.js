import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Batch from '@/models/Batch';
import { getCurrentUser } from '@/lib/auth';

// GET - Get single batch
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const batch = await Batch.findById(id)
      .populate('courseId', 'name code')
      .populate('teacherId', 'name email');

    if (!batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ batch });
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({ message: 'Error fetching batch' }, { status: 500 });
  }
}

// PUT - Update batch
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const batch = await Batch.findById(id);
    if (!batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }

    // Update fields
    const {
      name,
      courseId,
      teacherId,
      startDate,
      endDate,
      schedule,
      maxStudents,
      room,
      status,
      notes,
    } = data;

    if (name) batch.name = name;
    if (courseId) batch.courseId = courseId;
    if (teacherId !== undefined) batch.teacherId = teacherId || undefined;
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate) batch.endDate = new Date(endDate);
    if (schedule) {
      batch.schedule = {
        days: schedule.days || batch.schedule?.days || [],
        startTime: schedule.startTime || batch.schedule?.startTime || '',
        endTime: schedule.endTime || batch.schedule?.endTime || '',
        timezone: batch.schedule?.timezone || 'Asia/Karachi',
      };
    }
    if (maxStudents) batch.maxStudents = parseInt(maxStudents);
    if (room !== undefined) batch.room = room;
    if (status) batch.status = status;
    if (notes !== undefined) batch.notes = notes;

    await batch.save();

    const updatedBatch = await Batch.findById(id)
      .populate('courseId', 'name code')
      .populate('teacherId', 'name');

    return NextResponse.json({
      message: 'Batch updated successfully',
      batch: updatedBatch,
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ message: 'Error updating batch' }, { status: 500 });
  }
}

// DELETE - Delete batch (soft delete)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const batch = await Batch.findById(id);

    if (!batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    batch.isActive = false;
    await batch.save();

    return NextResponse.json({
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ message: 'Error deleting batch' }, { status: 500 });
  }
}
