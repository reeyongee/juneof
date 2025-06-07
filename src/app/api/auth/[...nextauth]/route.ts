import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs"; // Use bcryptjs

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // This will be your app_user_id from Supabase
      email?: string | null;
      name?: string | null;
    };
  }
  interface User {
    // The User object returned by authorize and used in callbacks
    id: string;
    email?: string | null;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId?: string;
    // email and name are standard claims NextAuth might add if present in user object
  }
}

// Initialize Supabase client (can be done outside if preferred)
// Note: For server-side NextAuth.js, you might use the service_role_key if needed for certain operations,
// but for reading user profiles for auth, anon_key + RLS is safer if RLS allows reads.
// Let's assume for credentials check we might need more direct access or specific function calls.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "johndoe@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log(
          "[NextAuth Authorize] Attempting to authorize user:",
          credentials?.email
        );
        if (!credentials?.email || !credentials?.password) {
          console.error("[NextAuth Authorize] Missing email or password.");
          throw new Error("Missing email or password.");
        }

        const { email, password } = credentials;

        const { data: userProfile, error: userError } = await supabaseAdmin
          .from("user_profiles")
          .select("id, email, hashed_password, name") // hashed_password is the scrypt PHC string
          .eq("email", email)
          .single();

        if (userError || !userProfile) {
          console.error(
            "[NextAuth Authorize] Error fetching user or user not found:",
            userError?.message
          );
          throw new Error("Invalid email or password."); // Keep generic for security
        }

        if (!userProfile.hashed_password) {
          console.error(
            "[NextAuth Authorize] User exists but has no password set:",
            email
          );
          throw new Error(
            "Account issue. Please contact support or try social login."
          );
        }

        let isValidPassword = false;
        try {
          console.log(
            "[NextAuth Authorize] Verifying password with bcryptjs for:",
            email
          );
          // bcryptjs.compare returns a promise resolving to boolean
          isValidPassword = await bcrypt.compare(
            password,
            userProfile.hashed_password
          );
          console.log(
            "[NextAuth Authorize] bcryptjs password verification result:",
            isValidPassword
          );
        } catch (verificationError) {
          console.error(
            "[NextAuth Authorize] bcryptjs password verification error:",
            verificationError
          );
          throw new Error("An error occurred during authentication.");
        }

        if (!isValidPassword) {
          console.warn(
            "[NextAuth Authorize] Invalid password attempt for:",
            email
          );
          throw new Error("Invalid email or password."); // Keep generic
        }

        console.log(
          "[NextAuth Authorize] User authenticated successfully:",
          userProfile.email
        );
        return {
          id: userProfile.id, // This is your Supabase user_profiles.id (app_user_id)
          email: userProfile.email,
          name: userProfile.name,
        };
      },
    }),
    // We will add GoogleProvider and AppleProvider here later
  ],
  session: {
    strategy: "jwt", // Using JWTs for session
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.appUserId = user.id;
        if (user.email) token.email = user.email; // Ensure these are carried over
        if (user.name) token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.appUserId && session.user) {
        session.user.id = token.appUserId as string;
      }
      if (token.email && session.user) {
        // Ensure these are passed to session
        session.user.email = token.email as string;
      }
      if (token.name && session.user) {
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
