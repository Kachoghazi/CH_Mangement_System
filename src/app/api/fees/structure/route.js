import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FeeStructure from '@/models/FeeStructure';
import Course from '@/models/Course';
import { getCurrentUser } from '@/lib/auth';

// GET - Get fee structures
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all courses with their fee info
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('feeStructureId')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const structures = courses.map((course) => ({
      _id: course._id,
      course: course.name,
      code: course.code,
      duration: `${course.durationMonths} months`,
      durationMonths: course.durationMonths,
      admissionFee: course.admissionFee || 0,
      tuitionFee: (course.totalFee || 0) - (course.admissionFee || 0),
      totalFee: course.totalFee || 0,
      installments: course.feeStructureId?.installments || 1,
      status: course.isActive ? 'active' : 'inactive',
    }));

    return NextResponse.json({
      structures,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return NextResponse.json({ message: 'Error fetching fee structures' }, { status: 500 });
  }
}

// POST - Create/Update fee structure
export async function POST(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { courseId, admissionFee, tuitionFee, installments } = data;

    const totalFee = (parseInt(admissionFee) || 0) + (parseInt(tuitionFee) || 0);

    // Update course fee
    await Course.findByIdAndUpdate(courseId, {
      admissionFee: parseInt(admissionFee) || 0,
      totalFee,
    });

    // Create or update fee structure
    let feeStructure = await FeeStructure.findOne({ courseId });
    if (feeStructure) {
      feeStructure.totalAmount = totalFee;
      feeStructure.installments = parseInt(installments) || 1;
      await feeStructure.save();
    } else {
      feeStructure = await FeeStructure.create({
        courseId,
        name: 'Standard',
        totalAmount: totalFee,
        installments: parseInt(installments) || 1,
        isActive: true,
      });

      await Course.findByIdAndUpdate(courseId, { feeStructureId: feeStructure._id });
    }

    return NextResponse.json({
      message: 'Fee structure updated successfully',
      feeStructure,
    });
  } catch (error) {
    console.error('Error updating fee structure:', error);
    return NextResponse.json({ message: 'Error updating fee structure' }, { status: 500 });
  }
}
