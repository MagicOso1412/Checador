import { createApp } from "./app";
import { runMigrations } from "./db/migrationRunner";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

runMigrations();

const app = createApp();

app.listen(PORT, () => {
  console.log(`[hkc-backend] escuchando en http://localhost:${PORT}`);
});
