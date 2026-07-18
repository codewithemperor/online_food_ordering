"use client";

import {
  useCartStore,
  CartItem,
  RestaurantCartGroup,
} from "@/stores/cart-store";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/ui-store";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  ShieldCheck,
  Loader2,
  CheckCircle,
  Store,
  AlertTriangle,
  UserCircle,
} from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";

export function CheckoutPanel() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    getItemCount,
    getGroupedByRestaurant,
    getRestaurantCount,
    getPerRestaurantSubtotal,
    getPerRestaurantDeliveryFee,
  } = useCartStore();
  const { isAuthenticated, user } = useAuth();
  const { setShowLogin } = useUIStore();
  const router = useRouter();
  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "COD">(
    "PAYSTACK",
  );
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryInstructions: "",
  });

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const nigerianStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT (Abuja)",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ];
  const nigerianCities = [
    "Lagos",
    "Ikeja",
    "Lekki",
    "Victoria Island",
    "Ikoyi",
    "Surulere",
    "Abuja",
    "Wuse",
    "Garki",
    "Maitama",
    "Port Harcourt",
    "Benin City",
    "Ibadan",
    "Kano",
    "Kaduna",
    "Enugu",
    "Aba",
    "Onitsha",
    "Calabar",
    "Uyo",
    "Warri",
    "Jos",
    "Ilorin",
    "Abeokuta",
    "Akure",
    "Owerri",
    "Maiduguri",
    "Sokoto",
    "Yola",
  ];

  const groups = getGroupedByRestaurant();
  const restaurantCount = getRestaurantCount();

  // Auto-fill from user profile when authenticated
  // Use a ref to avoid calling setState in effect
  const [autoFilledFromSession, setAutoFilledFromSession] = useState(false);

  if (isAuthenticated && user && !autoFilledFromSession && !profileLoaded) {
    const sessionName = user.name || "";
    const sessionPhone = (user as any)?.phone || "";
    const sessionAddress = (user as any)?.address || "";
    const sessionCity = (user as any)?.city || "";
    const sessionState = (user as any)?.state || "";
    if (sessionName || sessionPhone || sessionAddress) {
      setForm((prev) => ({
        ...prev,
        customerName: sessionName || prev.customerName,
        customerPhone: sessionPhone || prev.customerPhone,
        deliveryAddress: sessionAddress || prev.deliveryAddress,
        deliveryCity: sessionCity || prev.deliveryCity,
        deliveryState: sessionState || prev.deliveryState,
      }));
      setProfileLoaded(true);
    }
    setAutoFilledFromSession(true);
  }

  const handleAutoFill = async () => {
    try {
      const res = await fetch("/api/profile");
      const d = await res.json();
      if (d.data) {
        setForm((prev) => ({
          ...prev,
          customerName: d.data.name || prev.customerName,
          customerPhone: d.data.phone || prev.customerPhone,
          deliveryAddress: d.data.address || prev.deliveryAddress,
          deliveryCity: d.data.city || prev.deliveryCity,
          deliveryState: d.data.state || prev.deliveryState,
        }));
        toast.success("Details auto-filled from your profile");
      }
    } catch {
      toast.error("Could not fetch profile details");
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    if (items.length === 0) return;
    if (
      !form.customerName ||
      !form.customerPhone ||
      !form.deliveryAddress ||
      !form.deliveryCity ||
      !form.deliveryState
    ) {
      toast.error("Please fill in all required delivery fields");
      return;
    }
    if (form.customerPhone.replace(/\D/g, "").length < 11) {
      toast.error("Please enter a valid Nigerian phone number");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the order first
      const orderItems = items.map((item) => ({
        foodId: item.foodId,
        quantity: item.quantity,
        expectedPrice: item.price,
      }));
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: orderItems, paymentMethod }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("Prices have changed")) {
          toast.error("Some prices have changed. Please review your cart.");
        } else if (data.error?.includes("no longer available")) {
          toast.error("Some items are no longer available.");
        } else {
          toast.error(data.error || "Failed to place order");
        }
        setLoading(false);
        return;
      }

      const orderId = data.data?.id;
      const totalAmount = data.data?.totalAmount;

      // Step 2: If Paystack, initialize payment
      if (paymentMethod === "PAYSTACK" && orderId && totalAmount) {
        try {
          const payRes = await fetch("/api/paystack/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              email: user?.email,
              amount: totalAmount,
            }),
          });
          const payData = await payRes.json();

          if (payRes.ok && payData.data?.authorizationUrl) {
            clearCart();
            closeCart();
            // Redirect to Paystack payment page
            window.location.href = payData.data.authorizationUrl;
            return;
          } else {
            // Paystack init failed — fall back to COD
            toast.error(
              payData.error ||
                "Payment initialization failed. Order placed as COD.",
            );
            clearCart();
            closeCart();
            setIsCheckout(false);
            router.push("/orders");
            return;
          }
        } catch (payErr) {
          toast.error("Payment service unavailable. Order placed as COD.");
          clearCart();
          closeCart();
          setIsCheckout(false);
          router.push("/orders");
          return;
        }
      }

      // COD success
      clearCart();
      closeCart();
      setIsCheckout(false);
      toast.success("Order placed successfully! 🎉");
      router.push("/orders");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    // Pre-fill from profile API if not already loaded
    if (!profileLoaded) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((d) => {
          if (d.data) {
            setForm((prev) => ({
              ...prev,
              customerName: d.data.name || prev.customerName,
              customerPhone: d.data.phone || prev.customerPhone,
              deliveryAddress: d.data.address || prev.deliveryAddress,
              deliveryCity: d.data.city || prev.deliveryCity,
              deliveryState: d.data.state || prev.deliveryState,
            }));
            setProfileLoaded(true);
          }
        })
        .catch(() => {});
    }
    setIsCheckout(true);
  };

  // Check if form has any user data
  const hasProfileData = !!(
    form.customerName ||
    form.customerPhone ||
    form.deliveryAddress
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[99]"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full md:w-[420px] h-full z-[100] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
              <button
                onClick={() =>
                  isCheckout ? setIsCheckout(false) : closeCart()
                }
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                {isCheckout ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-primary" /> Secure
                    Checkout
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 text-primary" /> Your Cart
                  </>
                )}
              </h2>
              {items.length > 0 && !isCheckout && (
                <button
                  onClick={clearCart}
                  className="text-red-500 text-sm font-medium"
                >
                  Clear All
                </button>
              )}
              <div className="w-8" />
              {/* Spacer */}
            </div>

            {!isCheckout ? (
              /* ─── CART VIEW ─── */
              <>
                <div className="flex-1 bg-gray-900  px-6 py-6 overflow-y-auto cart-scrollbar">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <ShoppingCart className="w-16 h-16 text-gray-600 mb-4" />
                      <p className="text-gray-400 text-lg mb-2">
                        Your cart is empty
                      </p>
                      <button
                        onClick={() => {
                          closeCart();
                          router.push("/menu");
                        }}
                        className="mt-2 px-6 py-2 border border-orange-500 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/10"
                      >
                        Browse Menu
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Multi-restaurant notice */}
                      {restaurantCount > 1 && (
                        <div className="mb-4 bg-amber-900/40 border border-amber-600/50 rounded-lg p-3 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <p className="text-amber-300 text-sm">
                            Items from{" "}
                            <span className="font-bold">
                              {restaurantCount} restaurants
                            </span>{" "}
                            — each restaurant delivers separately.
                            Per-restaurant delivery fees apply.
                          </p>
                        </div>
                      )}

                      {/* Group items by restaurant */}
                      <div className="space-y-5">
                        {groups.map((group) => (
                          <div key={group.restaurantId}>
                            {/* Restaurant header */}
                            <div className="flex items-center gap-2 mb-2">
                              <Store className="w-4 h-4 text-orange-400" />
                              <span className="text-orange-400 font-semibold text-sm">
                                {group.restaurantName}
                              </span>
                              <span className="text-gray-500 text-xs">
                                ({group.items.length} item
                                {group.items.length !== 1 ? "s" : ""})
                              </span>
                            </div>

                            {/* Items */}
                            <div className="space-y-2">
                              {group.items.map((item) => (
                                <div
                                  key={item.foodId}
                                  className="bg-gray-700 rounded-lg p-3 flex items-center gap-3"
                                >
                                  {item.foodImage ? (
                                    <img
                                      src={item.foodImage}
                                      alt={item.foodName}
                                      className="w-14 h-14 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-full bg-orange-900/50 flex items-center justify-center text-lg">
                                      🍽️
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate">
                                      {item.foodName}
                                    </p>
                                    <p className="text-gray-300 font-semibold text-sm">
                                      <span className="naira-symbol">₦</span>
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        decrementQuantity(item.foodId)
                                      }
                                      className="w-6 h-6 bg-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-500"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-8 text-center text-white text-sm font-bold">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        incrementQuantity(item.foodId)
                                      }
                                      className="w-6 h-6 bg-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-500"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.foodId)}
                                    className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700"
                                  >
                                    <Trash2 className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Per-restaurant subtotal + delivery */}
                            <div className="mt-2 pt-2 border-t border-gray-600 flex justify-between text-sm">
                              <span className="text-gray-400">
                                Subtotal:{" "}
                                <span className="text-gray-200">
                                  {formatNaira(group.subtotal)}
                                </span>
                                {" · "}
                                Delivery:{" "}
                                <span
                                  className={
                                    group.deliveryFee === 0
                                      ? "text-green-400 font-medium"
                                      : "text-gray-200"
                                  }
                                >
                                  {group.deliveryFee === 0
                                    ? "FREE"
                                    : formatNaira(group.deliveryFee)}
                                </span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="bg-gray-800 px-6 py-4  border-t border-gray-700">
                    {restaurantCount > 1 && (
                      <div className="flex justify-between mb-2 text-xs">
                        <span className="text-gray-500">
                          Delivery ({restaurantCount} restaurants)
                        </span>
                        <span
                          className={
                            getDeliveryFee() === 0
                              ? "text-green-400 font-semibold"
                              : "text-gray-300"
                          }
                        >
                          {getDeliveryFee() === 0
                            ? "FREE"
                            : formatNaira(getDeliveryFee())}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="text-gray-200">
                        {formatNaira(getSubtotal())}
                      </span>
                    </div>
                    {restaurantCount <= 1 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Delivery</span>
                        <span
                          className={
                            getDeliveryFee() === 0
                              ? "text-green-400 font-semibold"
                              : "text-gray-200"
                          }
                        >
                          {getDeliveryFee() === 0
                            ? "FREE"
                            : formatNaira(getDeliveryFee())}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between mb-4 font-bold">
                      <span className="text-white text-lg">Total</span>
                      <span className="text-white text-lg">
                        {formatNaira(getTotal())}
                      </span>
                    </div>
                    <button
                      onClick={handleProceedToCheckout}
                      className="w-full py-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold text-lg hover:from-orange-500 hover:to-orange-700 transition-all shadow-lg"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* ─── CHECKOUT VIEW ─── */
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-6">
                  {/* Multi-restaurant notice in checkout */}
                  {restaurantCount > 1 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-amber-700 text-sm">
                        Your order contains items from{" "}
                        <strong>{restaurantCount} restaurants</strong>. Each
                        restaurant will prepare and deliver their items
                        separately. You&apos;ll see individual status updates
                        per restaurant.
                      </p>
                    </div>
                  )}

                  {/* Delivery Info */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">
                        Delivery Information
                      </h3>
                      {isAuthenticated && (
                        <button
                          onClick={handleAutoFill}
                          className="flex items-center gap-1.5 text-sm text-primary hover:text-orange-700 font-medium transition-colors"
                        >
                          <UserCircle className="w-4 h-4" />
                          Auto-fill from Profile
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={form.customerName}
                          onChange={(e) =>
                            setField("customerName", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"
                          placeholder={
                            isAuthenticated ? "" : "Sign in to auto-fill"
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={form.customerPhone}
                          onChange={(e) =>
                            setField("customerPhone", e.target.value)
                          }
                          placeholder="+234..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Address *
                        </label>
                        <textarea
                          value={form.deliveryAddress}
                          onChange={(e) =>
                            setField("deliveryAddress", e.target.value)
                          }
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <select
                            value={form.deliveryCity}
                            onChange={(e) =>
                              setField("deliveryCity", e.target.value)
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"
                          >
                            <option value="">Select</option>
                            {nigerianCities.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <select
                            value={form.deliveryState}
                            onChange={(e) =>
                              setField("deliveryState", e.target.value)
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"
                          >
                            <option value="">Select</option>
                            {nigerianStates.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Instructions (optional)
                        </label>
                        <textarea
                          value={form.deliveryInstructions}
                          onChange={(e) =>
                            setField("deliveryInstructions", e.target.value)
                          }
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Payment Method
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setPaymentMethod("PAYSTACK")}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${paymentMethod === "PAYSTACK" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <CreditCard
                          className={`w-6 h-6 ${paymentMethod === "PAYSTACK" ? "text-primary" : "text-gray-400"}`}
                        />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Paystack</p>
                          <p className="text-xs text-gray-500">
                            Card, Bank Transfer, USSD
                          </p>
                        </div>
                        {paymentMethod === "PAYSTACK" && (
                          <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </button>
                      <button
                        onClick={() => setPaymentMethod("COD")}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${paymentMethod === "COD" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <Banknote
                          className={`w-6 h-6 ${paymentMethod === "COD" ? "text-primary" : "text-gray-400"}`}
                        />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            Cash on Delivery
                          </p>
                          <p className="text-xs text-gray-500">
                            Pay when you receive your order
                          </p>
                        </div>
                        {paymentMethod === "COD" && (
                          <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Order Summary — grouped by restaurant */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Order Summary
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {groups.map((group) => (
                        <div key={group.restaurantId}>
                          <p className="font-medium text-sm text-gray-700 mb-1 flex items-center gap-1">
                            <Store className="w-3.5 h-3.5" />{" "}
                            {group.restaurantName}
                          </p>
                          {group.items.map((item) => (
                            <div
                              key={item.foodId}
                              className="flex justify-between text-sm pl-5"
                            >
                              <span className="text-gray-600">
                                {item.foodName} × {item.quantity}
                              </span>
                              <span className="font-medium">
                                {formatNaira(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs pl-5 pt-1 text-gray-500">
                            <span>Delivery</span>
                            <span
                              className={
                                group.deliveryFee === 0
                                  ? "text-green-600 font-medium"
                                  : ""
                              }
                            >
                              {group.deliveryFee === 0
                                ? "FREE"
                                : formatNaira(group.deliveryFee)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal</span>
                          <span>{formatNaira(getSubtotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Delivery</span>
                          <span
                            className={
                              getDeliveryFee() === 0
                                ? "text-green-600 font-medium"
                                : ""
                            }
                          >
                            {getDeliveryFee() === 0
                              ? "FREE"
                              : formatNaira(getDeliveryFee())}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-1">
                          <span>Total</span>
                          <span>{formatNaira(getTotal())}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={loading || items.length === 0}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold text-lg hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Processing...
                      </>
                    ) : paymentMethod === "PAYSTACK" ? (
                      <>Pay {formatNaira(getTotal())}</>
                    ) : (
                      <>Place Order (COD)</>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Secured by Paystack
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
