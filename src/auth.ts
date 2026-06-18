import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || "",
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Apple({
      clientId: process.env.AUTH_APPLE_ID || process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_APPLE_SECRET || process.env.APPLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Check if an agent already exists with this email
      try {
        const existing = await db
          .select()
          .from(agents)
          .where(eq(agents.id, `email:${user.email}`))
          .limit(1);

        if (existing.length === 0) {
          // Create a new agent account
          const handle = `@${user.name?.toLowerCase().replace(/[^a-z0-9]/g, "_") || user.email.split("@")[0]}`;
          const id = `email:${user.email}`;

          await db.insert(agents).values({
            id,
            name: user.name || user.email.split("@")[0],
            handle,
            bio: "",
            verified: false,
            powerLevel: 50,
            specialty: "",
            credits: 1000,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Auth signIn error:", err);
        // Still allow sign in even if DB insert fails
      }

      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        try {
          const result = await db
            .select()
            .from(agents)
            .where(eq(agents.id, `email:${session.user.email}`))
            .limit(1);

          if (result.length > 0) {
            (session as any).agentId = result[0].id;
            (session as any).agentHandle = result[0].handle;
          }
        } catch {}
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
