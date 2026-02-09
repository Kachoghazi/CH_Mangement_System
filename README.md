# CH Management System

A comprehensive Center/Institute Management System built with Next.js, Tailwind CSS, shadcn/ui, and MongoDB.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with HTTP-only cookies

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your MongoDB connection string:

   ```
   MONGODB_URI=mongodb://localhost:27017/ch_management
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

4. Seed the database with initial data:

   ```bash
   node src/scripts/seed.mjs
   ```

   This creates an admin user (admin@chms.com / admin123) and sample courses.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Dashboard pages (protected)
│   ├── api/                # API routes
│   └── auth/               # Authentication pages
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities (auth, db, utils)
├── models/                 # Mongoose schemas
├── scripts/                # Database scripts
└── styles/                 # Global styles
```

## Features

- **Student Management**: Admissions, profiles, course enrollment
- **Teacher Management**: Profiles, subject assignments, attendance
- **Course & Batch Management**: Course creation, batch scheduling
- **Fee Management**: Fee structures, invoices, payments
- **Attendance Tracking**: Student and teacher attendance
- **Reports & Analytics**: Dashboard statistics, revenue tracking
- **Document Generation**: Fee receipts, ID cards, certificates

## Database Models

- User, Admin, Student, Teacher
- Course, Subject, Batch
- Admission, StudentApplication
- FeeStructure, StudentFee, FeeInvoice, Payment
- AttendanceStudent, AttendanceTeacher
- GeneratedDocument, Settings

## Default Admin Credentials

After running the seed script:

- **Email**: admin@chms.com
- **Password**: admin123

## License

MIT
