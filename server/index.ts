import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url"; 
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "..", "db.json");

const EMPTY_DB: Record<string, any[]> = {
  users: [],
  movies: [],
  bookings: [],
  support: [],
  notifications: [],
  showtimes: [],
  verificationTokens: [],
};

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const initial = { ...EMPTY_DB };
      fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { ...EMPTY_DB };
  }
}

function writeDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const TOKEN_TTL_MS = 15 * 60 * 1000;

function generateVerificationToken() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // ===== AUTH =====
  app.post("/api/auth/request-token", (req, res) => {
    try {
      const { userId } = req.body || {};
      if (userId === undefined || userId === null || userId === "") {
        return res.status(400).json({ error: "El userId es obligatorio." });
      }

      const db = readDb();
      const user = db.users.find((u: any) => u.id == userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }

      if (user.verified) {
        return res.status(409).json({ error: "El usuario ya está verificado." });
      }

      const token = generateVerificationToken();
      const expiresAt = Date.now() + TOKEN_TTL_MS;

      db.verificationTokens = (db.verificationTokens || []).filter(
        (t: any) => String(t.userId) !== String(userId),
      );
      db.verificationTokens.push({ id: Date.now(), userId: Number(userId), token, expiresAt });
      writeDb(db);

      console.log(
        `[AUTH EMAIL DISPATCH] To: ${user.email} | Code: ${token} | Expires: ${new Date(expiresAt).toISOString()}`,
      );

      return res
        .status(200)
        .json({ message: "Código de verificación enviado al correo del usuario." });
    } catch (e) {
      return res.status(500).json({ error: "Error interno al procesar la solicitud." });
    }
  });

  app.post("/api/auth/verify-token", (req, res) => {
    try {
      const { userId, token } = req.body || {};
      if (userId === undefined || token === undefined || token === "") {
        return res.status(400).json({ error: "El userId y el token son obligatorios." });
      }

      const db = readDb();
      const record = (db.verificationTokens || []).find(
        (t: any) => String(t.userId) === String(userId) && t.token === token,
      );

      if (!record || record.expiresAt < Date.now()) {
        return res.status(400).json({ error: "Email o token inválidos / Token expirado." });
      }

      const user = db.users.find((u: any) => u.id == userId);
      if (user) {
        user.verified = true;
      }

      db.verificationTokens = (db.verificationTokens || []).filter((t: any) => t.id !== record.id);
      writeDb(db);

      return res.status(200).json({ message: "Token validado con éxito." });
    } catch (e) {
      return res.status(500).json({ error: "Error interno al verificar el token." });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "El correo y la contraseña son obligatorios." });
      }

      const db = readDb();
      const user = db.users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas." });
      }

      return res.status(200).json(user);
    } catch (e) {
      return res.status(500).json({ error: "Error interno al iniciar sesión." });
    }
  });

  // API Routes (Mocking JSON-Server)
  app.get("/api/:resource", (req, res) => {
    const db = readDb();
    const resource = req.params.resource;
    if (db[resource]) {
      if (resource === "notifications" && req.query.userId !== undefined) {
        res.json(db[resource].filter((i: any) => String(i.userId) === String(req.query.userId)));
      } else {
        res.json(db[resource]);
      }
    } else {
      res.status(404).json({ error: "Resource not found" });
    }
  });

  app.get("/api/:resource/:id", (req, res) => {
    const db = readDb();
    const { resource, id } = req.params;
    if (db[resource]) {
      const item = db[resource].find((i: any) => i.id == id);
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } else {
      res.status(404).json({ error: "Resource not found" });
    }
  });

  app.post("/api/:resource", (req, res) => {
    const db = readDb();
    const resource = req.params.resource;
    if (!db[resource]) {
      return res.status(404).json({ error: "Resource not found" });
    }

    try {
      // Validate unique email when creating users
      if (resource === "users" && req.body.email) {
        const exists = db.users.some((u: any) => u.email === req.body.email);
        if (exists) {
          return res.status(400).json({ error: "El correo ya existe" });
        }
      }

      const newItem = { id: Date.now(), ...req.body };

      // If resource is support, log the email dispatch to yunpapicodsito@gmail.com
      if (resource === "support") {
        console.log(`[SUPPORT EMAIL DISPATCH] To: yunpapicodsito@gmail.com | From: ${newItem.email} | Message: ${newItem.message}`);
        newItem.recipient = "yunpapicodsito@gmail.com";
        newItem.status = "Enviado con éxito a soporte";
      }

      // Notifications: schedule status by default
      if (resource === "notifications") {
        newItem.status = newItem.status || "Programada";
        newItem.createdAt = new Date().toISOString();
      }

      db[resource].push(newItem);
      writeDb(db);
      res.status(201).json(newItem);
    } catch (e) {
      res.status(500).json({ error: "No se pudo crear el usuario" });
    }
  });

  app.put("/api/:resource/:id", (req, res) => {
    const db = readDb();
    const { resource, id } = req.params;
    if (db[resource]) {
      const index = db[resource].findIndex((i: any) => i.id == id);
      if (index !== -1) {
        db[resource][index] = { ...db[resource][index], ...req.body, id: Number(id) };
        writeDb(db);
        res.json(db[resource][index]);
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } else {
      res.status(404).json({ error: "Resource not found" });
    }
  });

  app.delete("/api/:resource/:id", (req, res) => {
    const db = readDb();
    const { resource, id } = req.params;
    if (db[resource]) {
      db[resource] = db[resource].filter((i: any) => i.id != id);
      writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Resource not found" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
