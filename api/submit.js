import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      "unknown";

    const user_agent = req.headers["user-agent"] || "unknown";

    const { data, error } = await supabase.from("submissions").insert([
      {
        school: req.body.school,
        major: req.body.major,
        city: req.body.city,
        location: req.body.location,
        teacher: req.body.teacher,
        recruit: req.body.recruit,
        alumni: req.body.alumni,
        tutor: req.body.tutor,
        ratio: req.body.ratio,
        activity: req.body.activity,
        gra: req.body.gra,
        attend: req.body.attend,
        credit: req.body.credit,
        leave_score: req.body.leave,
        gpa: req.body.gpa,
        score: req.body.score,
        tier: req.body.tier,
        ip,
        user_agent,
      },
    ]);

    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: err.message });
  }
}
