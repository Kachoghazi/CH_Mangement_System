import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import Course from '@/models/Course';
import { getCurrentUser } from '@/lib/auth';

// GET - Get all subjects
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = { isActive: true };

    if (courseId) {
      query.courseId = courseId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Subject.countDocuments(query);
    const subjects = await Subject.find(query)
      .populate('courseId', 'name code')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      subjects: subjects.map((subject) => ({
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        credits: subject.credits,
        totalClasses: subject.totalClasses,
        courseId: subject.courseId?._id,
        courseName: subject.courseId?.name,
        courseCode: subject.courseId?.code,
        isActive: subject.isActive,
        createdAt: subject.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ message: 'Error fetching subjects' }, { status: 500 });
  }
}

// POST - Create new subject
export async function POST(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, code, description, credits, totalClasses, courseId } = data;

    if (!name || !courseId) {
      return NextResponse.json({ message: 'Name and course are required' }, { status: 400 });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Check for duplicate code within the same course
    if (code) {
      const existingSubject = await Subject.findOne({ code, courseId });
      if (existingSubject) {
        return NextResponse.json(
          { message: 'Subject with this code already exists in this course' },
          { status: 400 },
        );
      }
    }

    const subject = new Subject({
      name,
      code: code || undefined,
      description,
      credits: parseInt(credits) || 0,
      totalClasses: parseInt(totalClasses) || 0,
      courseId,
    });

    await subject.save();

    return NextResponse.json({
      message: 'Subject created successfully',
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        courseName: course.name,
      },
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ message: 'Error creating subject' }, { status: 500 });
  }
}

// PUT - Update subject
export async function PUT(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, name, code, description, credits, totalClasses, courseId, isActive } = data;

    if (!id) {
      return NextResponse.json({ message: 'Subject ID is required' }, { status: 400 });
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    }

    // Check for duplicate code if changing
    if (code && code !== subject.code) {
      const existingSubject = await Subject.findOne({
        code,
        courseId: courseId || subject.courseId,
        _id: { $ne: id },
      });
      if (existingSubject) {
        return NextResponse.json(
          { message: 'Subject with this code already exists in this course' },
          { status: 400 },
        );
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (credits !== undefined) updateData.credits = parseInt(credits) || 0;
    if (totalClasses !== undefined) updateData.totalClasses = parseInt(totalClasses) || 0;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSubject = await Subject.findByIdAndUpdate(id, updateData, { new: true }).populate(
      'courseId',
      'name code',
    );

    return NextResponse.json({
      message: 'Subject updated successfully',
      subject: {
        _id: updatedSubject._id,
        name: updatedSubject.name,
        code: updatedSubject.code,
        courseName: updatedSubject.courseId?.name,
      },
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json({ message: 'Error updating subject' }, { status: 500 });
  }
}

// DELETE - Delete subject
export async function DELETE(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Subject ID is required' }, { status: 400 });
    }

    // Soft delete - just mark as inactive
    await Subject.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ message: 'Error deleting subject' }, { status: 500 });
  }
}
