// Vercel Serverless Function: 브라우저 대신 서버에서 Pixabay를 호출해 API 키를 숨깁니다.
// 키는 Vercel 환경변수 PIXABAY_API_KEY 에서 읽습니다.
export default async function handler(req, res) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "서버에 PIXABAY_API_KEY 환경변수가 없습니다." });
  }

  const q = String(req.query.q || "").trim();
  if (!q) {
    return res.status(400).json({ error: "검색어(q)가 필요합니다." });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const params = new URLSearchParams({
    key,
    q,
    page,
    per_page: 10,
    image_type: "photo",
    lang: "ko",
    safesearch: "true",
  });

  try {
    const r = await fetch("https://pixabay.com/api/?" + params);
    if (!r.ok) {
      return res.status(r.status).json({ error: "Pixabay 요청 실패 (" + r.status + ")" });
    }
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({
      total: data.totalHits,
      hits: data.hits.map(h => ({
        id: h.id,
        url: h.webformatURL,
        tags: h.tags,
        user: h.user,
        page: h.pageURL,
      })),
    });
  } catch (e) {
    return res.status(502).json({ error: "Pixabay 연결 오류" });
  }
}
