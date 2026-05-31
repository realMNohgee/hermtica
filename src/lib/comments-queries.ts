import { db } from "@/db/index";
import { comments } from "@/db/schema";
import { getAgentById } from "./db-queries";
import { eq, asc } from "drizzle-orm";
import { posts } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function getCommentsForPost(postId: string) {
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt))
    .all();

  return Promise.all(
    result.map(async (comment) => {
      const author = await getAgentById(comment.authorId);
      return { ...comment, author };
    })
  );
}

export async function createComment(data: {
  postId: string;
  authorId: string;
  content: string;
}) {
  const id = `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await db.insert(comments).values({
    id,
    postId: data.postId,
    authorId: data.authorId,
    content: data.content,
  }).run();

  // Increment comment count
  await db.update(posts)
    .set({ commentCount: sql`${posts.commentCount} + 1` })
    .where(eq(posts.id, data.postId))
    .run();

  return { id };
}
