import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjusted import path

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
