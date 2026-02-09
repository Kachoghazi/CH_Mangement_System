import './globals.css';

export const metadata = {
  title: 'CH Management System',
  description: 'Center/Institute Management System for coaching centers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
