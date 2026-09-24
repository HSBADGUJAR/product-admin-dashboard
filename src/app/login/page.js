"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/authApi";
import { saveAccessToken } from "@/utils/auth";

export default function LoginPage() {
const router = useRouter();

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
e.preventDefault();

if (loading) return;

setError("");

if (!username.trim()) {
  setError("Username is required");
  return;
}

if (!password.trim()) {
  setError("Password is required");
  return;
}

try {
  setLoading(true);

  const data = await loginUser(username, password);

  saveAccessToken(data.accessToken);

  router.replace("/products");
} catch (error) {
  setError(
    error.response?.data?.message ||
      "Invalid username or password"
  );
} finally {
  setLoading(false);
}

};

return (
<main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
<div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">

    <h1 className="mb-1 text-2xl font-bold text-black">
      Admin Login
    </h1>

    <p className="mb-6 text-sm text-gray-600">
      Login to manage products
    </p>

    <form onSubmit={handleSubmit}>

      {/* Username */}
      <div className="mb-4">
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-black"
        >
          Username
        </label>

        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          placeholder="Enter username"
          autoComplete="username"
          className="box-border w-full rounded-md border-2 border-gray-300 bg-white px-3 py-3 text-base text-black placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
        />
      </div>

      {/* Password */}
      <div className="mb-4">
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-black"
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Enter password"
          autoComplete="current-password"
          className="box-border w-full rounded-md border-2 border-gray-300 bg-white px-3 py-3 text-base text-black placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Login */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>

    {/* Demo Credentials */}
    <div className="mt-5 rounded-md bg-gray-50 p-3 text-sm text-black">
      <p className="font-semibold">Demo Credentials</p>

      <p className="mt-2">
        Username: <strong>emilys</strong>
      </p>

      <p>
        Password: <strong>emilyspass</strong>
      </p>

     
    </div>

  </div>
</main>

);
}