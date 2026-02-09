import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Student from '@/models/Student';
import Admission from '@/models/Admission';
import StudentFee from '@/models/StudentFee';
import Payment from '@/models/Payment';
import { hashPassword, getCurrentUser } from '@/lib/auth';

// GET - List all students
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const course = searchParams.get('course');
    const batch = searchParams.get('batch');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = { deletedAt: null };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (course) {
      query.currentCourseId = course;
    }

    if (batch) {
      query.currentBatchId = batch;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('currentCourseId', 'name code')
      .populate('currentBatchId', 'batchCode name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch fee data for each student
    const studentIds = students.map((s) => s._id);
    const studentFees = await StudentFee.find({ studentId: { $in: studentIds } }).lean();

    // Map fee data to students
    const studentsWithFees = students.map((student) => {
      const feeRecord = studentFees.find((f) => f.studentId.toString() === student._id.toString());
      return {
        ...student,
        courseName: student.currentCourseId?.name || 'N/A',
        batchCode: student.currentBatchId?.batchCode || student.currentBatchId?.name || 'N/A',
        totalFee: feeRecord?.totalPayable || feeRecord?.feeStructureSnapshot?.totalAmount || 0,
        paidAmount: feeRecord?.totalPaid || 0,
        feesDue: (feeRecord?.totalPayable || 0) - (feeRecord?.totalPaid || 0),
        feeStatus: feeRecord?.status || 'pending',
      };
    });

    return NextResponse.json({
      students: studentsWithFees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ message: 'Error fetching students' }, { status: 500 });
  }
}

// POST - Create new student (admission)
export async function POST(request) {
  try {
    await dbConnect();

    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      guardianName,
      guardianPhone,
      guardianRelation,
      courseId,
      batchId,
      totalFee,
      discount,
      initialPayment,
      paymentMethod,
      previousEducation,
      notes,
    } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json({ message: 'Name and phone are required' }, { status: 400 });
    }

    // Create user account for the student
    let user = null;
    if (email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json(
          { message: 'A user with this email already exists' },
          { status: 409 },
        );
      }

      // Create user with temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      user = new User({
        email: email.toLowerCase(),
        passwordHash: await hashPassword(tempPassword),
        role: 'student',
        isActive: true,
        accountSource: 'admin_created',
      });
      await user.save();
    }

    // Create student profile
    const student = new Student({
      userId: user?._id,
      name,
      phone,
      email: email?.toLowerCase(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address: {
        street: address,
        city,
        state,
        pincode,
      },
      guardianName,
      guardianPhone,
      guardianRelation,
      currentCourseId: courseId || undefined,
      currentBatchId: batchId || undefined,
      status: 'active',
      admissionSource: 'admin_created',
      previousEducation,
      notes,
    });
    await student.save();

    // Create admission record
    const admission = new Admission({
      studentId: student._id,
      courseId: courseId || undefined,
      batchId: batchId || undefined,
      academicYear: Admission.getCurrentAcademicYear(),
      createdBy: session.profileId,
      remarks: notes,
    });
    await admission.save();

    // Update student with admission ID
    student.admissionId = admission._id;
    await student.save();

    // Create student fee record
    if (totalFee > 0) {
      const studentFee = new StudentFee({
        studentId: student._id,
        admissionId: admission._id,
        courseId: courseId || undefined,
        feeStructureSnapshot: {
          totalAmount: totalFee,
        },
        discountAmount: discount || 0,
        totalPayable: totalFee - (discount || 0),
        totalPaid: initialPayment || 0,
        status:
          initialPayment >= totalFee - (discount || 0)
            ? 'paid'
            : initialPayment > 0
              ? 'partial'
              : 'pending',
      });
      await studentFee.save();

      // Create payment record if initial payment was made
      if (initialPayment > 0) {
        const payment = new Payment({
          studentId: student._id,
          studentFeeId: studentFee._id,
          amount: initialPayment,
          paymentMethod: paymentMethod || 'cash',
          paymentType: 'admission',
          status: 'completed',
          receivedBy: session.profileId,
        });
        await payment.save();
      }
    }

    return NextResponse.json(
      {
        message: 'Student admission created successfully',
        studentId: student._id,
        student: {
          id: student._id,
          studentId: student.studentId,
          name: student.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { message: 'Error creating student: ' + error.message },
      { status: 500 },
    );
  }
}
