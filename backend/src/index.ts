import express from "express";
import cors from "cors";
import tasksRouter from "./routes/tasks";
import listsRouter from "./routes/lists";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/tasks", tasksRouter);
app.use("/api/lists", listsRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Standard Task Library API listening on http://localhost:${port}`);
});
