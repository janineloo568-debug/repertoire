import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { internalEmailForUsername } from "@/lib/auth/internal-email";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalizeUsername, usernameSchema } from "@/lib/validations/username";

const registerSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(120).optional(),
});

function firstValidationError(error: z.ZodError) {
  const fieldErrors = error.flatten().fieldErrors;
  return Object.values(fieldErrors).flat()[0] ?? "Invalid input";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
  }

  const username = normalizeUsername(parsed.data.username);
  const { password, name } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing[0]) {
    return NextResponse.json({ error: "That username is taken" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  try {
    const inserted = await db
      .insert(users)
      .values({
        email: internalEmailForUsername(username),
        username,
        name: name ?? null,
        passwordHash,
      })
      .returning({ id: users.id, username: users.username });

    const user = inserted[0];
    if (!user?.username) {
      return NextResponse.json({ error: "Could not create user" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId: user.id, username: user.username });
  } catch (err) {
    console.error("register failed", err);
    return NextResponse.json({ error: "Could not create user" }, { status: 500 });
  }
}
