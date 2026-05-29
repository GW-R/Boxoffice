import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "d63b11f8e34cc51e2c8469237a821b90";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim() === "" || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY가 설정되지 않았거나 기본 예시 값(MY_GEMINI_API_KEY)입니다. 우측 상단의 'Settings > Secrets' 메뉴에서 GEMINI_API_KEY라는 비밀 키 이름으로 실제 API 키를 등록해주세요.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // Gemini AI review generator endpoint
  app.post("/api/review/generate", async (req, res) => {
    try {
      const { movieNm, genres, directors, actors, keywords } = req.body;
      if (!movieNm) {
        return res.status(400).json({ error: "영화 제목 정보가 누락되었습니다." });
      }
      if (!keywords || !Array.isArray(keywords) || keywords.length !== 3) {
        return res.status(400).json({ error: "감상평을 만들 키워드 3개를 입력해야 합니다." });
      }

      const cleanKeywords = keywords.map(k => String(k).trim()).filter(Boolean);
      if (cleanKeywords.length !== 3) {
        return res.status(400).json({ error: "키워드 3개를 모두 올바르게 채워주세요." });
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (e: any) {
        return res.status(500).json({ 
          error: "Gemini API 클라이언트를 연결하지 못했습니다. AI Studio의 'Settings > Secrets' 메뉴에서 GEMINI_API_KEY가 등록되어 있는지 확인해주세요." 
        });
      }

      const prompt = `
영화에 대한 한국어 감상평(리뷰)을 작성해주세요.
주어진 영화 정보와 사용자가 직접 제시한 3가지 핵심 감상 키워드를 감상평 문맥 속에 매우 자연스럽게 녹여내어, 독자의 흥미를 끄는 진솔하고 설격력 높은 서평을 완성해주세요.

[영화 세부 사항]
- 영화 제목: ${movieNm}
${genres ? `- 장르: ${genres}` : ""}
${directors ? `- 감독: ${directors}` : ""}
${actors ? `- 출연: ${actors}` : ""}

[사용자 지정 핵심 감상 키워드 (3개)]
${cleanKeywords.map((kw, idx) => `${idx + 1}. ${kw}`).join("\n")}

[작성 수칙]
1. 사용자가 준 세 가지 키워드 ("${cleanKeywords.join('", "')}")를 감상평 텍스트 내에 정확하게 자연스럽게 삽입해야 합니다. 억지로 끼워 넣은 흔적을 줄이고 자연스러운 명사 혹은 활용 형태로 녹여주세요.
2. 친근하면서도 정제된 전문 영화 리뷰어 어조(예: ~이다, ~한다 등으로 끝나거나 경어체)를 사용하여, 서정적이고 멋진 감상평을 작성해주세요.
3. 한글 300자 내외로 2~3개 분량의 문단으로 읽기 좋게 나누어 답해주세요. (제목은 적지 말고 리뷰 본문만 깔끔히 작성해주세요.)
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const generatedText = response.text || "감상평을 생성할 수 없습니다.";
      res.json({ review: generatedText });
    } catch (error: any) {
      console.error("AI Review Generation error:", error);
      res.status(500).json({ error: error.message || "감상평을 작성하는 중에 에러가 빌드 측에서 발생했습니다." });
    }
  });

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
