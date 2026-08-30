"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { signIn, signInWithGoogle } from "../../lib/firebase/auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe redirect helper
  const safeRedirect = (url: string | null) => {
    if (!url) return null;
    if (!url.startsWith("/")) return null;
    try {
      const parsed = new URL(url, "http://placeholder");
      if (parsed.origin !== "http://placeholder") return null;
    } catch {
      return null;
    }
    return url;
  };

  // If user is already logged in, redirect immediately
  if (isAuthenticated) {
    const redirect = safeRedirect(searchParams.get("redirect"));
    router.replace(redirect ?? "/customer/search");
    return null;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      const redirect = safeRedirect(searchParams.get("redirect"));
      router.replace(redirect ?? "/customer/search");
    } catch (err: any) {
      const code = err?.code;
      let msg = "Authentication failed. Please try again.";
      if (code === "auth/invalid-email") msg = "Invalid email address.";
      else if (code === "auth/user-not-found") msg = "No account found for this email.";
      else if (code === "auth/wrong-password") msg = "Incorrect password.";
      else if (code === "auth/too-many-requests") msg = "Too many attempts. Try later.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      const redirect = safeRedirect(searchParams.get("redirect"));
      router.replace(redirect ?? "/customer/search");
    } catch (err: any) {
      const code = err?.code;
      let msg = "Google sign‑in failed. Please try again.";
      if (code === "auth/popup-closed-by-user") msg = "Sign‑in popup closed before completing.";
      else if (code === "auth/cancelled-popup-request") msg = "Sign‑in cancelled.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-100 to-indigo-200 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg p-8 space-y-6">
        {/* Branding Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-800">MedBridge</h1>
          <p className="mt-2 text-gray-600">Secure access to your health portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" aria-live="assertive" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or continue with</span>
          </div>
        </div>

        {/* Google Sign‑In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
            <path d="M533.5 278.4c0-18.7-1.5-37.1-4.4-54.8H272v103.7h146.9c-6.4 34.9-25.6 64.5-54.5 84.4v70.4h88.1c51.7-47.6 81.5-117.8 81.5-203.7" fill="#4285F4" />
            <path d="M272 544.3c73.4 0 134.9-24.2 179.9-65.8l-88.1-70.4c-24.5 16.5-55.7 26.2-91.8 26.2-70.6 0-130.4-47.7-151.9-111.5H31.6v70.1c44.9 88.8 137.2 151.4 240.4 151.4" fill="#34A853" />
            <path d="M120.1 322.8c-10.8-31.8-10.8-66 0-97.8V154.9H31.6c-41.6 81.9-41.6 178.2 0 260.1l88.5-70.2" fill="#FBBC05" />
            <path d="M272 107.7c39.6-.6 77.8 14.9 106.8 43.2l79.9-79.9C410.9 22.1 342.5-1.2 272 0c-103.2 0-195.5 62.6-240.4 151.4l88.5 70.1c21.5-63.8 81.3-111.5 151.9-111.5" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Loading…</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
