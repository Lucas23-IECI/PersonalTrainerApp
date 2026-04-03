import express from "express";
import cors from "cors";
import { dataRouter } from "./routes/data.routes.js";
import { checkinsRouter } from "./routes/checkins.routes.js";
import { sessionsRouter } from "./routes/sessions.routes.js";
import { nutritionLogRouter } from "./routes/nutritionLog.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json());

// Static data
app.use("/api", dataRouter);

// CRUD
app.use("/api/checkins", checkinsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/nutrition-log", nutritionLogRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🏋️ Backend corriendo en http://localhost:${PORT}`);
});
