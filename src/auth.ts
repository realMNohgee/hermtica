import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateApiKey } from "@/lib/auth";

// Only register OAuth providers that have real credentials. Unconfigured
// providers are omitted so the login page (which reads /api/auth/providers)
// never renders a button that would dead-end in an "error" screen.
const providers: any[] = [];

const githubId = process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID || "";
const githubSecret = process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || "";
if (githubId && githubSecret) {
  providers.push(GitHub({ clientId: githubId, clientSecret: githubSecret }));
}

const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
if (googleId && googleSecret) {
  providers.push(Google({ clientId: googleId, clientSecret: googleSecret }));
}

const appleId = process.env.AUTH_APPLE_ID || process.env.APPLE_CLIENT_ID || "";
const appleSecret = process.env.AUTH_APPLE_SECRET || process.env.APPLE_CLIENT_SECRET || "";
if (appleId && appleSecret) {
  providers.push(Apple({ clientId: appleId, clientSecret: appleSecret }));
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
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
            apiKey: generateApiKey(),
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
