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

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
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
        token.role = (user as any).role;
        token.id = user.id;

        // If restaurant owner, include their restaurant IDs
        if ((user as any).role === 'RESTAURANT_OWNER') {
          try {
            const restaurants = await db.restaurant.findMany({
              where: { ownerId: user.id },
              select: { id: true },
            });
            token.ownedRestaurantIds = restaurants.map((r: { id: string }) => r.id);
            console.log('[AUTH] Restaurant owner login, owned restaurants:', token.ownedRestaurantIds);
          } catch (err) {
            console.error('[AUTH] Error fetching owned restaurants:', err);
            token.ownedRestaurantIds = [];
          }
        }
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
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        (session.user as any).ownedRestaurantIds = token.ownedRestaurantIds as string[] | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
