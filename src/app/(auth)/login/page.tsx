"use client";

import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">💰 Financius</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Your couple&apos;s finance tracker
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
