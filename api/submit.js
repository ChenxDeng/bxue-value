const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 数值 → 中文映射
const LABELS = {
  school: { 10: "清北/华五", 8.5: "中等985", 7: "末流985/强势211", 5.5: "普通211", 4: "双一流(非211)", 3.5: "强势双非(深大/杭电)", 2: "普通双非", 0.5: "民办/专科" },
  major: { 1.0: "计算机/金融/量化", 0.8: "电子/通信/自动化", 0.5: "传统工科/理学", 0.35: "管理/经济/法学", 0.15: "文科/社科/艺术" },
  city: { 10: "北上广深", 7.5: "新一线", 5: "省会城市", 2.5: "普通地级市", 1: "偏远/非省会城市" },
  location: { 10: "市中心/地铁直达CBD", 7: "城区校区1h内到CBD", 4: "近郊大学城1.5h+", 1: "远郊/偏远校区2h+" },
  teacher: { 10: "直接内推实习", 5: "偶尔推荐", 0: "纯学术" },
  recruit: { 10: "大厂免笔试/直通车", 5: "有宣讲会", 0: "走过场" },
  alumni: { 10: "天天发内推码", 5: "偶尔有", 0: "死群" },
  tutor: { 10: "免费辅导+mentor", 5: "有但一般", 0: "没有" },
  ratio: { 10: "<15:1", 5: "~25:1", 0: ">50:1" },
  activity: { 10: "企业赞助竞赛", 5: "偶尔有", 0: "几乎没有" },
  gra: { 10: "轻松拿到含金量高", 5: "需要竞争", 0: "卷也没用" },
  attend: { 10: "随便翘", 5: "偶尔点名", 0: "每节签到" },
  credit: { 10: "大厂可抵学分", 5: "需审批", 0: "不允许" },
  leave: { 10: "秒批", 5: "能批", 0: "不放人" },
  gpa: { 10: "给分宽松", 5: "正常", 0: "压分严重" },
};

function label(key, val) {
  if (val === null || val === undefined) return null;
  const map = LABELS[key];
  if (!map) return String(val);
  return map[val] || String(val);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      "unknown";

    const user_agent = req.headers["user-agent"] || "unknown";
    const b = req.body;

    const { data, error } = await supabase.from("submissions").insert([
      {
        school: b.school,
        major: b.major,
        city: b.city,
        location: b.location,
        teacher: b.teacher,
        recruit: b.recruit,
        alumni: b.alumni,
        tutor: b.tutor,
        ratio: b.ratio,
        activity: b.activity,
        gra: b.gra,
        attend: b.attend,
        credit: b.credit,
        leave_score: b.leave,
        gpa: b.gpa,
        score: b.score,
        tier: b.tier,
        // 中文标签
        school_label: label("school", b.school),
        major_label: label("major", b.major),
        city_label: label("city", b.city),
        location_label: label("location", b.location),
        teacher_label: label("teacher", b.teacher),
        recruit_label: label("recruit", b.recruit),
        alumni_label: label("alumni", b.alumni),
        tutor_label: label("tutor", b.tutor),
        ratio_label: label("ratio", b.ratio),
        activity_label: label("activity", b.activity),
        gra_label: label("gra", b.gra),
        attend_label: label("attend", b.attend),
        credit_label: label("credit", b.credit),
        leave_label: label("leave", b.leave),
        gpa_label: label("gpa", b.gpa),
        ip,
        user_agent,
      },
    ]);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
