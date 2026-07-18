# Authentication & Security Planning

## 1. Authentication Architecture

### 1.1 Overview
- **Provider:** NextAuth.js v4 with Credentials provider only
- **Strategy:** JWT (no database sessions)
- **Session Duration:** 30 days
- **Password Hashing:** bcryptjs with 12 salt rounds
- **No Email Verification** (as specified)
- **No Social Login** (as specified)

### 1.2 User Roles
```typescript
enum Role {
  CUSTOMER = "CUSTOMER",  // Default role, can browse, order, manage own profile/orders
  ADMIN = "ADMIN",        // Can access admin panel, manage all resources
}
```

### 1.3 User Status
```typescript
enum UserStatus {
  ACTIVE = "ACTIVE",      // Normal active user
  BLOCKED = "BLOCKED",    // Blocked by admin, cannot login
}
```

---

## 2. Registration Flow

### 2.1 Registration Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full Name | text | Yes | Min 2 characters, max 100 |
| Email | email | Yes | Valid email format, unique |
| Password | password | Yes | Min 8 characters, show strength |
| Confirm Password | password | Yes | Must match password |
| Phone | tel | No | Nigerian format: +234XXXXXXXXX or 0XXXXXXXXXX |
| Delivery Address | textarea | No | Min 10 characters if provided |
| City | select | No | From Nigerian cities list |
| State | select | No | From Nigerian states list |

### 2.2 Registration Process

```
User fills registration form
  → Client-side validation (all required fields, email format, password match, phone format)
  → POST /api/auth/register
    → Server-side validation (Zod schema)
    → Check email uniqueness
    → Hash password with bcrypt (12 salt rounds)
    → Create user in database (role: CUSTOMER, status: ACTIVE)
    → Auto-login via NextAuth signIn('credentials')
  → Success: Redirect to home, toast "Welcome to NaijaBites! 🎉"
  → Error: Show specific error message
```

### 2.3 Zod Validation Schema

```typescript
const registerSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  phone: z.string()
    .regex(/^(\+234|0)[789]\d{9}$/, "Please enter a valid Nigerian phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

### 2.4 Password Strength Indicator

```typescript
function getPasswordStrength(password: string): {
  score: number; label: string; color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "red" };
  if (score <= 4) return { score, label: "Medium", color: "yellow" };
  return { score, label: "Strong", color: "green" };
}
```

---

## 3. Login Flow

### 3.1 Login Form Fields

| Field | Type | Required |
|-------|------|----------|
| Email | email | Yes |
| Password | password | Yes (with show/hide toggle) |

### 3.2 Login Process

```
User fills login form
  → Client-side validation (email format, password not empty)
  → NextAuth signIn('credentials', { email, password })
    → CredentialsProvider.authorize()
      → Find user by email
      → Check if user exists
      → Check if user.status !== BLOCKED
      → Compare password with bcrypt
      → If valid: Return user object (id, name, email, role)
      → If invalid: Throw error "Invalid email or password"
    → JWT callback: Add role and id to token
    → Session callback: Add role and id to session
  → Success: Close login modal, toast "Welcome back!"
  → Error: Show error message
```

### 3.3 Error Messages

| Error | Message | Style |
|-------|---------|-------|
| Invalid credentials | "Invalid email or password" | Red text |
| Account blocked | "Your account has been blocked. Please contact support." | Red text |
| Missing fields | "Please fill in all fields" | Red text |
| Server error | "Something went wrong. Please try again." | Red text |
| Too many attempts | (Future: Rate limiting) | Red text |

---

## 4. Session Management

### 4.1 JWT Token Structure

```typescript
interface NaijaBitesToken {
  id: string;           // User ID (CUID)
  email: string;
  name: string;
  role: Role;           // CUSTOMER or ADMIN
  image?: string;       // Avatar URL
  iat: number;          // Issued at
  exp: number;          // Expiration
  jti: string;          // JWT ID (for revocation if needed)
}
```

### 4.2 Session Structure

```typescript
interface NaijaBitesSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    image?: string;
  };
  expires: string;      // ISO date string
}
```

### 4.3 NextAuth Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (user.status === "BLOCKED") {
          throw new Error("Your account has been blocked. Please contact support.");
        }

        const isValidPassword = await compare(credentials.password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      
      // Update session (e.g., name change)
      if (trigger === "update" && session) {
        token.name = session.name;
        token.image = session.image;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",    // No separate login page; use modal
    error: "/",     // Redirect to home on error
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 4.4 Session Access Patterns

```typescript
// Server-side (API routes)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (!session) return unauthorized();
if (session.user.role !== 'ADMIN') return forbidden();

// Client-side (components)
import { useSession } from "next-auth/react";
const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
// session.user.role for admin check

// Client-side (hooks)
function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isAdmin: session?.user?.role === "ADMIN",
  };
}
```

---

## 5. Authorization System

### 5.1 Role-Based Access Control (RBAC)

| Resource | CUSTOMER | ADMIN |
|----------|----------|-------|
| Browse foods/restaurants | ✅ | ✅ |
| Add to cart | ✅ | ✅ |
| Place orders | ✅ | ✅ |
| View own orders | ✅ | ✅ |
| Cancel own order (PENDING) | ✅ | ✅ |
| Update own profile | ✅ | ✅ |
| View all orders | ❌ | ✅ |
| Update order status | ❌ | ✅ |
| Delete orders | ❌ | ✅ |
| Manage categories | ❌ | ✅ |
| Manage restaurants | ❌ | ✅ |
| Manage foods | ❌ | ✅ |
| Manage users | ❌ | ✅ |
| View dashboard | ❌ | ✅ |
| View earnings | ❌ | ✅ |
| Upload images | ❌ | ✅ |
| Access admin section | ❌ | ✅ |

### 5.2 Server-Side Authorization Helpers

```typescript
// lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireAdmin() {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  if (session!.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireOwnerOrAdmin(userId: string) {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  if (session!.user.role !== "ADMIN" && session!.user.id !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
```

### 5.3 Client-Side Authorization

```typescript
// hooks/useAuth.ts
import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isAdmin: session?.user?.role === "ADMIN",
    isCustomer: session?.user?.role === "CUSTOMER",
  };
}

// Usage in components
function AdminOnlyFeature() {
  const { isAdmin, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPrompt />;
  if (!isAdmin) return <AccessDenied />;
  return <AdminContent />;
}
```

---

## 6. Security Measures

### 6.1 Password Security

| Measure | Implementation |
|---------|---------------|
| Hashing | bcryptjs with 12 salt rounds |
| Minimum length | 8 characters |
| Strength check | Client-side indicator (weak/medium/strong) |
| No plaintext storage | Password never returned in API responses |
| No password in logs | Password excluded from all logging |

### 6.2 API Security

| Measure | Implementation |
|---------|---------------|
| Input validation | Zod schemas on ALL endpoints |
| SQL injection | Prisma ORM parameterized queries |
| XSS | React auto-escaping, sanitize user input |
| CSRF | SameSite cookies (NextAuth default) |
| Rate limiting | (Future: Add rate limiting middleware) |
| CORS | Same-origin only (Next.js default) |
| File upload | Type/size validation, unique filenames |

### 6.3 Session Security

| Measure | Implementation |
|---------|---------------|
| JWT strategy | No session IDs to steal |
| HTTP-only cookies | NextAuth sets cookies as HTTP-only |
| Secure cookies | In production (NEXTAUTH_URL=https://) |
| Secret key | NEXTAUTH_SECRET env variable |
| Session expiry | 30 days max |

### 6.4 Paystack Security

| Measure | Implementation |
|---------|---------------|
| Webhook signature | HMAC-SHA512 verification |
| Server-side verification | Always verify with Paystack API, not just callback params |
| Amount verification | Check returned amount matches order total |
| Secret key | PAYSTACK_SECRET_KEY env variable (server only) |
| Public key | NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (client-safe) |

### 6.5 File Upload Security

| Measure | Implementation |
|---------|---------------|
| Type validation | Only jpg, jpeg, png, webp |
| Size limit | Max 2MB |
| Filename | Sanitized, unique (timestamp + random) |
| Directory | public/uploads/ (not in src/) |
| No executable files | Extension whitelist only |
| Admin only | Only admins can upload (except avatar) |

---

## 7. Environment Variables

### 7.1 Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/naijabites"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Paystack (User will add test keys later)
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxxx"
PAYSTACK_WEBHOOK_SECRET="xxxxxxxxxxxxx"

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="NaijaBites"
```

### 7.2 Variable Security
- All `SECRET` and private keys: Server-side only (no `NEXT_PUBLIC_` prefix)
- `NEXT_PUBLIC_` variables: Safe for client-side exposure
- `.env` file: Never committed to git
- `.env.example`: Committed with placeholder values

---

## 8. Agentic Prompt for Auth Implementation

```
You are implementing the AUTHENTICATION & SECURITY system for NaijaBites, a Nigerian food ordering web application.

## NextAuth Setup
1. Install next-auth@4, bcryptjs
2. Create lib/auth.ts with complete NextAuth configuration
3. Credentials provider only (NO social login)
4. JWT strategy with 30-day max age
5. Add user role (CUSTOMER/ADMIN) to JWT token and session
6. Block check on login (user.status !== BLOCKED)
7. Custom error messages: "Invalid email or password", "Your account has been blocked"
8. Pages: signIn redirects to "/" (client-side modal)

## Registration API
1. POST /api/auth/register with Zod validation
2. Fields: name (min 2), email (valid, unique), password (min 8, uppercase, lowercase, number), confirmPassword (match), phone (Nigerian format), address, city, state
3. bcrypt hash with 12 salt rounds
4. Auto-login after registration via signIn('credentials')
5. Return user data (NO password)

## Auth Helpers
1. lib/auth-helpers.ts: requireAuth(), requireAdmin(), requireOwnerOrAdmin()
2. Used in ALL protected API routes
3. Return proper 401/403 responses

## Client-Side Auth
1. Auth modals (Login + Register) as HeroUI Modals
2. Login: Email + Password + show/hide toggle
3. Register: Full form with password strength indicator
4. useSession() for auth state
5. useAuth() custom hook (isAuthenticated, isAdmin, isLoading)
6. Admin check: session.user.role === 'ADMIN'

## Security Checklist
- bcryptjs 12 salt rounds for passwords
- JWT with NEXTAUTH_SECRET
- Zod validation on ALL endpoints
- Prisma parameterized queries (no SQL injection)
- Paystack webhook HMAC-SHA512 verification
- File upload type/size validation
- HTTP-only cookies (NextAuth default)
- Never return password in responses
- Admin-only API routes with requireAdmin()
- Owner check for user-specific operations

## Default Admin
- Email: admin@naijabites.ng
- Password: admin123
- Role: ADMIN
- Created via seed script
```
