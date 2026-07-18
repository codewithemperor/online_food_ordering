import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Format Naira ─────────────────────────────────────
export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Generate Order Number ────────────────────────────
export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 900) + 100; // 3-digit random
  return `ORD-${dateStr}${random}`;
}

// ─── Status Colors ────────────────────────────────────
export function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'PENDING':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'CONFIRMED':
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'PREPARING':
      return { bg: 'bg-orange-100', text: 'text-orange-800' };
    case 'ON_THE_WAY':
      return { bg: 'bg-purple-100', text: 'text-purple-800' };
    case 'DELIVERED':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'CANCELLED':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'PAID':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'FAILED':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'REFUNDED':
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
    case 'ACTIVE':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'BLOCKED':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

// ─── Status Icons ─────────────────────────────────────
export function getStatusIcon(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Clock';
    case 'CONFIRMED':
      return 'CheckCircle';
    case 'PREPARING':
      return 'ChefHat';
    case 'ON_THE_WAY':
      return 'Truck';
    case 'DELIVERED':
      return 'PackageCheck';
    case 'CANCELLED':
      return 'XCircle';
    case 'PAID':
      return 'BadgeCheck';
    case 'FAILED':
      return 'AlertCircle';
    case 'REFUNDED':
      return 'Undo2';
    case 'ACTIVE':
      return 'CheckCircle';
    case 'BLOCKED':
      return 'Ban';
    default:
      return 'HelpCircle';
  }
}
