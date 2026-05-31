import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { rateLimit } from "@/lib/rate-limit";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  if (!rateLimit(`upload:${getIP(request)}`, 5)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 });
    }

    // Validate file size > 0
    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    // Sanitize filename — only allow safe extension
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";

    // Validate extension against allowlist
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify magic bytes match claimed type
    const magic = buffer.slice(0, 4).toString("hex");
    const typeValid = (
      (ext === "jpg" || ext === "jpeg") && (magic.startsWith("ffd8")) ||
      (ext === "png") && (magic === "89504e47") ||
      (ext === "gif") && (magic.startsWith("474946")) ||
      (ext === "webp") && (magic.startsWith("52494646"))
    );

    if (!typeValid) {
      return NextResponse.json({ error: "File content does not match extension" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate safe filename
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(uploadDir, safeName);

    // Prevent path traversal
    if (!filepath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
