"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingBag,
  ArrowRight,
  Home,
} from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { motion } from "framer-motion";

type PaymentStatus = "verifying" | "success" | "failed" | "error";

interface PaymentResult {
  status: PaymentStatus;
  reference?: string;
  amount?: number;
  orderId?: string;
  message?: string;
}

// Loading fallback shown while Suspense is resolving
function PaymentLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-center bg-orange-500">
          <Loader2 className="w-16 h-16 text-white mx-auto animate-spin" />
          <h1 className="text-2xl font-bold text-white mt-4">Loading...</h1>
        </div>
        <div className="p-6 text-center text-gray-400 text-sm">
          Please wait while we check your payment status.
        </div>
      </div>
    </div>
  );
}

// Inner component that uses useSearchParams — must be inside Suspense
function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");

  // Use TanStack Query to verify payment — avoids setState-in-effect lint issue
  const { data: result, isLoading } = useQuery<PaymentResult>({
    queryKey: ["paystack-verify", reference],
    queryFn: async () => {
      if (!reference) {
        return {
          status: "error" as PaymentStatus,
          message:
            "No payment reference found. If you made a payment, please check your orders or contact support.",
        };
      }

      try {
        const res = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(reference)}`,
        );
        const data = await res.json();

        if (!res.ok) {
          return {
            status: "error" as PaymentStatus,
            reference,
            message:
              data.error ||
              "Payment verification failed. Please check your orders.",
          };
        }

        if (data.data?.status === "success") {
          return {
            status: "success" as PaymentStatus,
            reference: data.data.reference,
            amount: data.data.amount,
            orderId: data.data.orderId,
          };
        } else if (data.data?.status === "failed") {
          return {
            status: "failed" as PaymentStatus,
            reference: data.data.reference,
            orderId: data.data.orderId,
            message:
              "Your payment was not successful. Please try again or choose a different payment method.",
          };
        } else if (data.data?.status === "pending") {
          // Throw to trigger retry via TanStack Query
          throw new Error("PENDING");
        } else {
          return {
            status: "error" as PaymentStatus,
            reference,
            message: "Unexpected payment status. Please check your orders.",
          };
        }
      } catch (err) {
        // If it's our PENDING error, re-throw so TanStack Query retries
        if (err instanceof Error && err.message === "PENDING") {
          throw err;
        }
        return {
          status: "error" as PaymentStatus,
          reference: reference || undefined,
          message:
            "Could not verify your payment. If you completed payment, your order will be confirmed automatically.",
        };
      }
    },
    enabled: !!reference,
    retry: 3, // Retry up to 3 times for pending payments
    retryDelay: 3000, // Wait 3 seconds between retries
  });

  // Derive display status
  const displayResult: PaymentResult = !reference
    ? {
        status: "error",
        message:
          "No payment reference found. If you made a payment, please check your orders or contact support.",
      }
    : isLoading && !result
      ? { status: "verifying" }
      : result || { status: "verifying" };

  const status = displayResult.status;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Status Header */}
          <div
            className={`p-8 text-center ${
              status === "success"
                ? "bg-green-500"
                : status === "failed"
                  ? "bg-red-500"
                  : status === "error"
                    ? "bg-gray-500"
                    : "bg-orange-500"
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            >
              {status === "verifying" && (
                <Loader2 className="w-16 h-16 text-white mx-auto animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle className="w-16 h-16 text-white mx-auto" />
              )}
              {status === "failed" && (
                <XCircle className="w-16 h-16 text-white mx-auto" />
              )}
              {status === "error" && (
                <XCircle className="w-16 h-16 text-white mx-auto" />
              )}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-white mt-4"
            >
              {status === "verifying" && "Verifying Payment..."}
              {status === "success" && "Payment Successful!"}
              {status === "failed" && "Payment Failed"}
              {status === "error" && "Something Went Wrong"}
            </motion.h1>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            {displayResult.message && (
              <p className="text-gray-600 text-sm text-center">
                {displayResult.message}
              </p>
            )}

            {displayResult.reference && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {displayResult.amount ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-semibold">
                      {formatNaira(displayResult.amount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono text-xs text-gray-700">
                    {displayResult.reference}
                  </span>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 text-sm">
                  Your order has been confirmed! The restaurant(s) will start
                  preparing your food soon.
                </p>
              </div>
            )}

            {status === "failed" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 text-sm">
                  Your payment was not completed. You can try again from your
                  orders page.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {status === "success" && (
                <button
                  onClick={() => router.push("/orders")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold text-lg hover:from-orange-500 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  View My Orders
                </button>
              )}

              {status === "failed" && displayResult.orderId && (
                <button
                  onClick={() => router.push("/orders")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold hover:from-orange-500 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  Retry Payment
                </button>
              )}

              <button
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 pt-2">
              Powered by{" "}
              <span className="font-medium text-gray-500">Paystack</span> ·
              NaijaBites
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Page default export wraps content in Suspense boundary (required for useSearchParams)
export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
