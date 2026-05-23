import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  getCurrentUser,
} from "../lib/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return void res
        .status(400)
        .json({ success: false, message: "Email dan password wajib diisi." });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return void res
        .status(401)
        .json({ success: false, message: "Email tidak ditemukan." });
    }
    if (!user.isActive) {
      return void res
        .status(403)
        .json({ success: false, message: "Akun ini sudah dinonaktifkan." });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return void res
        .status(401)
        .json({ success: false, message: "Password salah." });
    }
    const token = await createSessionToken(user.id);
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("session", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });
    res.json({ success: true, message: "Login berhasil." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("session", { path: "/" });
  res.json({ success: true, message: "Logout berhasil." });
});

router.get("/auth/me", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return void res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      return void res
        .status(400)
        .json({ success: false, message: "Invalid input" });
    }
    if (password.length < 8) {
      return void res
        .status(400)
        .json({ success: false, message: "Password must be at least 8 characters" });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return void res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash, role: "OWNER" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      const restaurant = await tx.restaurant.create({
        data: { name: `${name}'s Restaurant`, ownerId: newUser.id },
      });
      await tx.user.update({
        where: { id: newUser.id },
        data: { restaurantId: restaurant.id },
      });
      return newUser;
    });
    res
      .status(201)
      .json({ success: true, message: "User registered successfully", data: user });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
