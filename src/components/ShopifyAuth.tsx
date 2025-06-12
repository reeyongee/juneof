"use client";

import { useState, useEffect } from "react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: {
    emailAddress: string;
  };
  phoneNumber?: {
    phoneNumber: string;
  };
}

interface CustomerData {
  data: {
    customer: Customer;
  };
  errors?: Array<{ message: string }>;
}

export default function ShopifyAuth() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    window.location.href = "/api/auth/shopify/login";
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/shopify/logout", {
        method: "POST",
      });

      if (response.ok) {
        setCustomer(null);
        setError(null);
      } else {
        setError("Failed to logout");
      }
    } catch {
      setError("Failed to logout");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/customer/profile");
      const data: CustomerData = await response.json();

      if (response.ok && data.data?.customer) {
        setCustomer(data.data.customer);
      } else if (response.status === 401) {
        setCustomer(null);
        setError("Please log in to view your profile");
      } else {
        setError(data.errors?.[0]?.message || "Failed to fetch profile");
      }
    } catch {
      setError("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to fetch customer profile on component mount
    fetchCustomerProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (customer) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Welcome back!</h2>
        <div className="space-y-2 mb-6">
          <p>
            <strong>Name:</strong> {customer.firstName} {customer.lastName}
          </p>
          <p>
            <strong>Email:</strong> {customer.emailAddress.emailAddress}
          </p>
          {customer.phoneNumber && (
            <p>
              <strong>Phone:</strong> {customer.phoneNumber.phoneNumber}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <button
            onClick={fetchCustomerProfile}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Customer Login</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <p className="text-gray-600 mb-6">
        Sign in with your Shopify customer account to access your profile and
        order history.
      </p>
      <button
        onClick={handleLogin}
        className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
      >
        Login with Shopify
      </button>
    </div>
  );
}
