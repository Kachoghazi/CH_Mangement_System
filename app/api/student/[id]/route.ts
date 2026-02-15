import { connectToDatabase } from '@/lib/db';
import { Student } from '@/models/Student';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Student ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const student = await Student.findById(id).lean();

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(
      { data: student, message: 'Student fetched successfully' },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Fetch Student Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Student ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const deletedStudent = await Student.findByIdAndDelete(id).lean();

    if (!deletedStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Student deleted successfully', data: deletedStudent },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Delete Student Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Student ID format' }, { status: 400 });
    }

    const body = await request.json();
    await connectToDatabase();
    const updatedStudent = await Student.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(
      { data: updatedStudent, message: 'Student updated successfully' },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Update Student Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}
