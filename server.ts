import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "d63b11f8e34cc51e2c8469237a821b90";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // KOBIS Daily Box Office Proxy
  app.get("/api/boxoffice", async (req, res) => {
    try {
      const { targetDt } = req.query;
      if (!targetDt || typeof targetDt !== "string") {
        return res.status(400).json({ error: "targetDt parameter is required (Format: YYYYMMDD)" });
      }

      // Check if targetDt is valid length
      if (targetDt.length !== 8 || isNaN(Number(targetDt))) {
        return res.status(400).json({ error: "targetDt must be exactly 8 digits of format YYYYMMDD" });
      }

      const url = `https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${targetDt}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching KOBIS Box Office:", error);
      res.status(500).json({ error: error.message || "Failed to fetch box office data" });
    }
  });

  // KOBIS Movie Info Proxy
  app.get("/api/movie", async (req, res) => {
    try {
      const { movieCd } = req.query;
      if (!movieCd || typeof movieCd !== "string") {
        return res.status(400).json({ error: "movieCd parameter is required" });
      }

      const url = `https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching KOBIS Movie Info:", error);
      res.status(500).json({ error: error.message || "Failed to fetch movie details" });
    }
  });

  // Vite development middleware vs Static Production Build serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
