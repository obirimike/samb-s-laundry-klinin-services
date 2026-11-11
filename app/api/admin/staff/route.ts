import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(30).optional(),
   password: z
  .string()
  .min(10, "Staff passwords must contain at least 10 characters.")
  .max(72, "Staff passwords must not exceed 72 characters.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Staff passwords are too long."
  ),
  })
  .strict();

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can manage staff." },
        { status: 403 }
      );
    }

    const staff = await db.user.findMany({
      where: { role: "STAFF" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        accountStatus: true,
        createdAt: true,
        assignmentsReceived: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
      staff: staff.map(({assignmentsReceived, ...member }: any) => ({
        ...member,
        createdAt: member.createdAt.toISOString(),
        activeAssignmentCount: assignmentsReceived.length,
      })),
    });
  } catch (error) {
    console.error("Failed to retrieve staff:", error);

    return NextResponse.json(
      { message: "Unable to retrieve staff." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can create staff accounts." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Please provide valid JSON." },
        { status: 400 }
      );
    }

    const parsed = createStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please check the staff account details.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await hash(password, 12);

    const staff = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        passwordHash,
        role: "STAFF",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Staff account created successfully.",
        staff,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "An account with that email address already exists." },
        { status: 409 }
      );
    }

    console.error("Failed to create staff account:", error);

    return NextResponse.json(
      { message: "Unable to create the staff account." },
      { status: 500 }
    );
  }
}
