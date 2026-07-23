import { Router } from "express";
import { getDatabase } from "../db/db";
import { firmarSesionRh } from "../lib/jwt";
import { verifyPassword } from "../lib/password";

export const authRouter = Router();

interface UsuarioRhRow {
  id: string;
  email: string;
  nombre: string;
  password_hash: string;
}

/**
 * Login del portal RH. No hay registro público — los usuarios se dan de
 * alta con `scripts/crearUsuarioRh.ts` (ver README.md). Responde un JWT de
 * 8 horas; el portal lo manda como `Authorization: Bearer <token>` en las
 * llamadas siguientes (ver `middleware/jwtAuth.ts`).
 */
authRouter.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Se requieren email y password" });
    return;
  }

  const usuario = getDatabase()
    .prepare<[string], UsuarioRhRow>(
      "SELECT id, email, nombre, password_hash FROM usuarios_rh WHERE email = ? AND activo = 1",
    )
    .get(email);

  if (!usuario || !verifyPassword(password, usuario.password_hash)) {
    // Mismo mensaje para "no existe" y "password incorrecto" — no revelar
    // cuál de las dos cosas falló (evita enumerar emails válidos).
    res.status(401).json({ error: "Email o contraseña incorrectos" });
    return;
  }

  const token = firmarSesionRh({ usuarioId: usuario.id, email: usuario.email });

  res.json({ token, usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre } });
});
