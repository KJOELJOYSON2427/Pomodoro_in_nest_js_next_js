"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Input from "@/components/ui/Input";
import Button from "../ui/Button";
import { useState } from "react";
import { loginUser, verifyOTP } from "@/lib/api";
import FormError from "../ui/FormError";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

interface LoginResponse {
  message: string;
  twoFactorRequired?: boolean;
  userId?: number;
}

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormSchema = z.infer<typeof formSchema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // 2FA states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const router = useRouter();
  const { setLoggedIn } = useAuthStore();

  const onSubmit = async (data: FormSchema) => {
    setIsLoading(true);
    setServerError("");

    try {
      const response = await loginUser(data);

      if (!response.ok) {
        const errorData = await response.json();
        setServerError(errorData.message || "Login failed. Please try again.");
        return;
      }

      const result: LoginResponse = await response.json();

      // 2FA is required
      if (result.twoFactorRequired) {
        setShow2FAModal(true);
        // Backend should have set pending_user cookie at this point
        return;
      }

      // Normal successful login (no 2FA)
      setLoggedIn(true);
      router.push("/dashboard");
    } catch (err) {
      setServerError("An unexpected error occurred. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.trim().length !== 6) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    setOtpError("");

    try {
      const response = await verifyOTP(otp.trim());

      
      // Success!
      setLoggedIn(true);
      setShow2FAModal(false);

      // Small delay → better UX (cookie/session propagation)
      await new Promise((resolve) => setTimeout(resolve, 400));

      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setOtpError(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {serverError && <FormError message={serverError} />}

        <Input
          label="Email"
          type="email"
          {...register("email")}
          error={errors.email?.message}
          id="email"
        />

        <Input
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
          id="password"
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300" />
          <span className="px-2 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>

        {/* Social Login */}
        <div className="flex flex-col space-y-2">
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}>
            <Button type="button" className="w-full bg-red-500 hover:bg-red-600">
              Login with Google
            </Button>
          </a>

          <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}>
            <Button
              type="button"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white"
            >
              Login with GitHub
            </Button>
          </a>
        </div>
      </form>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-6">Two-Factor Authentication</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Enter the 6-digit code from your authenticator app
            </p>

            <div className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setOtpError("");
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />

              {otpError && <FormError message={otpError} />}

              <Button
              type="submit"
                onClick={handleVerifyOTP}
                disabled={verifying}
                className="w-full"
              >
                {verifying ? "Verifying..." : "Verify"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShow2FAModal(false);
                  setOtp("");
                  setOtpError("");
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}