import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { requireApiRole } from "@/lib/auth/require-api-role";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

function getFileExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER]);

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          message: auth.error.message,
        },
        {
          status: auth.error.status,
        },
      );
    }

    const formData = await req.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Image file is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, and WEBP images are allowed",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image size must be under 2MB",
        },
        {
          status: 400,
        },
      );
    }

    const extension = getFileExtension(file);

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image format",
        },
        {
          status: 400,
        },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "menu",
    );

    await mkdir(uploadDir, {
      recursive: true,
    });

    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const url = `/uploads/menu/${fileName}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          url,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("[UPLOAD_MENU_IMAGE_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload menu image",
      },
      {
        status: 500,
      },
    );
  }
}