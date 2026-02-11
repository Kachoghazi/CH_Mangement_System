'use client';
import axios from 'axios';
import React from 'react';

function Register() {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [apiResponse, setApiResponse] = React.useState(null);
  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/register', {
        fullName,
        email,
        password,
      });
      console.log(response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error(error);
    }
  }
  ;
  return (
    <div>
      <h1>Register</h1>
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Register
        </button>

        {/* User detail after registration */}
        {apiResponse && (
          <div>
            <h2 className="text-lg font-medium text-gray-900">User Details</h2>
            <p className="text-sm text-gray-600">Full Name: {apiResponse?.data?.fullName}</p>
            <p className="text-sm text-gray-600">Email: {apiResponse?.data?.email}</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default Register;
