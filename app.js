// ============================================
// b学上的值不值 · 主逻辑 v2
// 拔河模型：在校价值 vs 实习价值
// ============================================

// ---- 状态 ----
const state = {
  school: null, major: null, city: null, location: null,
  teacher: null, recruit: null, alumni: null,
  tutor: null, ratio: null, activity: null, gra: null,
  attend: null, credit: null, leave: null, gpa: null
};

// ---- 初始化 ----
document.addEventListener("DOMContentLoaded", () => {
  initRadioButtons();
  checkUrlParams();
});

function initRadioButtons() {
  document.querySelectorAll(".radio-group").forEach(group => {
    const key = group.dataset.key;
    group.querySelectorAll(".radio-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        group.querySelectorAll(".radio-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state[key] = parseFloat(btn.dataset.value);
        updateScore();
      });
    });
  });
}

// ---- 计算拔河分数 ----
// 返回 0-10，其中：
// 0-4 = 实习端赢（建议出去实习）
// 4-6 = 势均力敌
// 6-10 = 在校端赢（建议留在学校）
function calcTugScore() {
  const { school, major, city, location, teacher, recruit, alumni, tutor, ratio, activity, gra, attend, credit, leave, gpa } = state;
  if (school === null || major === null) return null;

  // ---- 校内资源 ----
  const resources = [teacher, recruit, alumni, tutor, ratio, activity, gra];
  const resourceVals = resources.filter(v => v !== null);
  const resourceAvg = resourceVals.length > 0
    ? resourceVals.reduce((a, b) => a + b, 0) / resourceVals.length
    : 5;

  // ---- 行政灵活度 ----
  const admins = [attend, credit, leave, gpa];
  const adminVals = admins.filter(v => v !== null);
  const adminAvg = adminVals.length > 0
    ? adminVals.reduce((a, b) => a + b, 0) / adminVals.length
    : 5;

  // ---- 压缩专业系数 ----
  // 热门专业：学校好但实习也好，不该给满额品牌加成
  // 冷门专业：学校帮助有限，但也不该打到骨折
  // 1.0→0.85, 0.8→0.75, 0.5→0.55, 0.35→0.45, 0.15→0.3
  const majorBlend = 0.45 + major * 0.4;

  // ---- 基础在校价值 ----
  const schoolValue = school * majorBlend + resourceAvg * 0.35 + adminAvg * 0.1;

  // ---- 实习拉力折扣 ----
  const cityVal = city !== null ? city : 5;
  const locVal = location !== null ? location : 5;
  const geoAdvantage = cityVal * 0.6 + locVal * 0.4;
  const pullDiscount = (geoAdvantage / 10) * 0.35;

  const score = schoolValue * (1 - pullDiscount);

  return Math.min(10, Math.max(0, score));
}

// ---- 获取两端百分比 ----
function getTugPercentages() {
  const score = calcTugScore();
  if (score === null) return { school: 50, intern: 50 };
  const schoolPct = Math.round(score * 10);
  return {
    school: schoolPct,
    intern: 100 - schoolPct
  };
}

// ---- 实时更新 ----
function updateScore() {
  updateTugBar();
}

function updateTugBar() {
  const pct = getTugPercentages();
  const fill = document.getElementById("tugFill");
  const leftPct = document.getElementById("tugLeftPct");
  const rightPct = document.getElementById("tugRightPct");

  if (fill) fill.style.width = pct.school + "%";
  if (leftPct) leftPct.textContent = pct.school + "%";
  if (rightPct) rightPct.textContent = pct.intern + "%";
}

// ---- 辅助函数 ----
function getSchoolLevel(val) {
  if (val >= 8) return "high";
  if (val >= 4) return "mid";
  return "low";
}

function getMajorLevel(val) {
  if (val >= 0.7) return "high";
  if (val >= 0.4) return "mid";
  return "low";
}

function getResourceLevel(avg) {
  if (avg >= 6.5) return "high";
  if (avg >= 3.5) return "mid";
  return "low";
}

function getAdminLevel(avg) {
  if (avg >= 6.5) return "high";
  if (avg >= 3.5) return "mid";
  return "low";
}

function getTier(score) {
  for (const tier of DATA.tiers) {
    if (score >= tier.min && score <= tier.max) return tier;
  }
  return DATA.tiers[DATA.tiers.length - 1];
}

function getComboKey(schoolLevel, majorLevel) {
  return schoolLevel + "_" + majorLevel;
}

// 获取选中选项的描述文本
function getSelectedText(key) {
  const dim = DATA.dimensions[key];
  if (!dim || state[key] === null) return null;
  const opt = dim.options.find(o => o.value === state[key]);
  return opt ? { text: opt.text, desc: opt.desc } : null;
}

// ---- 提交 ----
function calculate() {
  if (state.school === null || state.major === null) {
    alert("请至少选择学校层级和专业类别");
    return;
  }
  const score = calcTugScore();
  if (score === null) return;
  submitData(score);
  showResult(score);
}

// ---- 提交数据到 Supabase ----
function submitData(score) {
  const tier = getTier(score);
  const payload = { ...state, score: parseFloat(score.toFixed(2)), tier: tier.id };

  fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {}); // 静默失败，不影响用户体验
}

// ---- 展示结果 ----
function showResult(score) {
  document.querySelector(".form-page")?.classList.add("hidden");
  document.querySelector(".container").insertAdjacentHTML("beforeend", buildResultPage(score));
  drawRadar();
  window.scrollTo(0, 0);
}

function buildResultPage(score) {
  const tier = getTier(score);
  const tierIdx = DATA.tiers.indexOf(tier);
  const schoolLevel = getSchoolLevel(state.school);
  const majorLevel = getMajorLevel(state.major);

  const resourceAvg = (state.teacher + state.recruit + state.alumni + state.tutor + state.ratio + state.activity + state.gra) / 7;
  const adminAvg = (state.attend + state.credit + state.leave + state.gpa) / 4;
  const resourceLevel = getResourceLevel(resourceAvg);
  const adminLevel = getAdminLevel(adminAvg);

  const schoolAnalysis = DATA.school[state.school];
  const majorAnalysis = DATA.major[state.major];
  const cityAnalysis = state.city !== null ? DATA.city[state.city] : null;
  const locationAnalysis = state.location !== null ? DATA.location[state.location] : null;
  const resourceAnalysis = DATA.resource[resourceLevel];
  const adminAnalysis = DATA.admin[adminLevel];

  const comboKey = getComboKey(schoolLevel, majorLevel);
  const combo = DATA.combos.school_major[comboKey];

  const pct = getTugPercentages();

  // 构建选择摘要
  const summaryItems = [];
  const dims = ["school", "major", "city", "location", "teacher", "recruit", "alumni", "tutor", "ratio", "activity", "gra", "attend", "credit", "leave", "gpa"];
  dims.forEach(key => {
    const sel = getSelectedText(key);
    if (sel) {
      // 判断这个维度是偏向在校还是实习
      let tagClass = "tag-neutral";
      let tagText = "中性";
      if (key === "school" || key === "teacher" || key === "recruit" || key === "alumni" || key === "tutor" || key === "ratio" || key === "activity" || key === "gra") {
        // 资源类：高分 = 在校端
        if (state[key] >= 7) { tagClass = "tag-school"; tagText = "利好在校"; }
        else if (state[key] <= 3) { tagClass = "tag-intern"; tagText = "利好实习"; }
      } else if (key === "city" || key === "location") {
        // 地理类：好城市/好区位 = 实习机会多
        if (state[key] >= 7) { tagClass = "tag-intern"; tagText = "实习机会多"; }
        else if (state[key] <= 3) { tagClass = "tag-school"; tagText = "实习受限"; }
      } else if (key === "major") {
        // 专业：热门 = 实习机会多，冷门 = 学校没用
        if (state[key] >= 0.7) { tagClass = "tag-intern"; tagText = "市场抢人"; }
        else if (state[key] <= 0.2) { tagClass = "tag-intern"; tagText = "学校教的没用"; }
      } else if (key === "attend" || key === "credit" || key === "leave" || key === "gpa") {
        // 行政类：灵活 = 有利于实习
        if (state[key] >= 7) { tagClass = "tag-intern"; tagText = "实习友好"; }
        else if (state[key] <= 3) { tagClass = "tag-school"; tagText = "出不去"; }
      }

      summaryItems.push(`
        <div class="summary-item">
          <span class="tag ${tagClass}">${tagText}</span>
          <strong>${sel.text}</strong> — ${sel.desc}
        </div>
      `);
    }
  });

  return `
    <div class="result-page show">
      <!-- 诊断徽章 -->
      <div class="tier-badge">
        <div class="tier-label">你的大学诊断结果</div>
        <div class="tier-score tier-${tierIdx}">${score.toFixed(1)}</div>
        <div class="tier-name tier-${tierIdx}">${tier.emoji} ${tier.id} · ${tier.name}</div>
        <div class="tier-desc">${tier.summary}</div>
      </div>

      <!-- 拔河可视化 -->
      <div class="tug-bar" style="position:relative">
        <div class="tug-track">
          <div class="tug-fill" style="width:${pct.school}%"></div>
        </div>
        <div class="tug-labels">
          <span class="tug-label-left">📚 重心在校 <strong>${pct.school}%</strong></span>
          <span class="tug-label-right"><strong>${pct.intern}%</strong> 重心实习 💼</span>
        </div>
      </div>

      <!-- 你的选择摘要 -->
      <div class="summary-card">
        <h3>📋 你的选择摘要</h3>
        ${summaryItems.join("")}
      </div>

      <!-- 雷达图 -->
      <div class="radar-section">
        <h3>维度雷达图</h3>
        <canvas id="radarChart" width="360" height="360"></canvas>
      </div>

      <!-- 综合诊断 -->
      <div class="diagnosis-card">
        <h3><span class="icon">📊</span> 综合诊断</h3>
        <p>${combo.diag}</p>
      </div>

      <!-- 学校 -->
      <div class="diagnosis-card">
        <h3><span class="icon">🏫</span> 学校维度</h3>
        <p>${schoolAnalysis.diag}</p>
        <p style="margin-top:8px"><span class="highlight">${schoolAnalysis.advice}</span></p>
      </div>

      <!-- 专业 -->
      <div class="diagnosis-card">
        <h3><span class="icon">📚</span> 专业维度</h3>
        <p>${majorAnalysis.diag}</p>
        <p style="margin-top:8px"><span class="highlight">${majorAnalysis.advice}</span></p>
      </div>

      ${cityAnalysis ? `
      <!-- 城市 -->
      <div class="diagnosis-card">
        <h3><span class="icon">🏙️</span> 城市等级</h3>
        <p>${cityAnalysis.diag}</p>
        <p style="margin-top:8px"><span class="highlight">${cityAnalysis.advice}</span></p>
      </div>` : ""}

      ${locationAnalysis ? `
      <!-- 区位 -->
      <div class="diagnosis-card">
        <h3><span class="icon">📍</span> 校区区位</h3>
        <p>${locationAnalysis.diag}</p>
        <p style="margin-top:8px"><span class="highlight">${locationAnalysis.advice}</span></p>
      </div>` : ""}

      <!-- 资源 -->
      <div class="diagnosis-card">
        <h3><span class="icon">🔧</span> 校内资源 <span class="${resourceLevel === 'high' ? 'highlight' : resourceLevel === 'low' ? 'danger' : 'warn'}">(${resourceAvg.toFixed(1)}/10)</span></h3>
        <p>${resourceAnalysis.diag}</p>
        <p style="margin-top:8px"><span class="highlight">${resourceAnalysis.advice}</span></p>
      </div>

      <!-- 行政 -->
      <div class="diagnosis-card">
        <h3><span class="icon">📋</span> 行政灵活度 <span class="${adminLevel === 'high' ? 'highlight' : adminLevel === 'low' ? 'danger' : 'warn'}">(${adminAvg.toFixed(1)}/10)</span></h3>
        <p>${adminAnalysis.diag}</p>
        <p style="margin-top:8px"><span class="highlight">${adminAnalysis.advice}</span></p>
      </div>

      <!-- 行动指南 -->
      <div class="action-guide">
        <h3>${tier.emoji} 行动指南</h3>
        <ul>
          ${tier.action.map(a => `<li>${a}</li>`).join("")}
        </ul>
      </div>

      <!-- 组合建议 -->
      <div class="diagnosis-card">
        <h3><span class="icon">🎯</span> 你的处境：${combo.label}</h3>
        <p>${combo.advice}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="result-actions">
        <button class="btn-restart" onclick="restart()">重新测算</button>
        <button class="btn-share" onclick="shareResult()">分享报告</button>
      </div>

      <div class="footer">
        <p></p>
      </div>
    </div>
  `;
}

// ---- 雷达图（纯Canvas） ----
function drawRadar() {
  const canvas = document.getElementById("radarChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) / 2 - 40;

  const labels = ["学校品牌", "专业热度", "城市等级", "校区区位", "校内资源", "行政灵活"];
  const values = [
    state.school / 10,
    state.major,
    (state.city !== null ? state.city : 5) / 10,
    (state.location !== null ? state.location : 5) / 10,
    ((state.teacher + state.recruit + state.alumni + state.tutor + state.ratio + state.activity + state.gra) / 7) / 10,
    ((state.attend + state.credit + state.leave + state.gpa) / 4) / 10
  ];

  const n = labels.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, W, H);

  // 网格
  for (let level = 1; level <= 5; level++) {
    const r = (R * level) / 5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 轴线
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 标签
  ctx.fillStyle = "#666";
  ctx.font = "12px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const lx = cx + (R + 24) * Math.cos(angle);
    const ly = cy + (R + 24) * Math.sin(angle);
    ctx.fillText(labels[i], lx, ly);
  }

  // 数据区域
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const idx = i % n;
    const angle = startAngle + idx * angleStep;
    const r = R * Math.max(0, Math.min(1, values[idx]));
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(37, 99, 235, 0.12)";
  ctx.fill();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 数据点
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const r = R * Math.max(0, Math.min(1, values[i]));
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#2563eb";
    ctx.fill();
  }
}

// ---- 重新测算 ----
function restart() {
  Object.keys(state).forEach(k => state[k] = null);
  document.querySelectorAll(".radio-btn").forEach(b => b.classList.remove("active"));
  const resultPage = document.querySelector(".result-page");
  if (resultPage) resultPage.remove();
  document.querySelector(".form-page")?.classList.remove("hidden");
  updateScore();
  window.scrollTo(0, 0);
}

// ---- 分享 ----
function shareResult() {
  const score = calcTugScore();
  if (score === null) return;

  const params = new URLSearchParams({
    s: state.school, m: state.major, c: state.city || "", loc: state.location || "",
    t: state.teacher, r: state.recruit, a: state.alumni,
    tu: state.tutor, ra: state.ratio, ac: state.activity,
    g: state.gra, at: state.attend, cr: state.credit,
    l: state.leave, gp: state.gpa
  });

  const url = window.location.origin + window.location.pathname + "?" + params.toString();

  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert("链接已复制到剪贴板！分享给同学看看他们的大学值不值");
    });
  } else {
    prompt("复制下面的链接分享：", url);
  }
}

// ---- URL参数恢复 ----
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("s") || !params.has("m")) return;

  const keyMap = {
    s: "school", m: "major", c: "city", loc: "location",
    t: "teacher", r: "recruit", a: "alumni",
    tu: "tutor", ra: "ratio", ac: "activity",
    g: "gra", at: "attend", cr: "credit",
    l: "leave", gp: "gpa"
  };

  for (const [param, key] of Object.entries(keyMap)) {
    const val = params.get(param);
    if (val !== null && val !== "") state[key] = parseFloat(val);
  }

  document.querySelectorAll(".radio-group").forEach(group => {
    const key = group.dataset.key;
    if (state[key] !== null) {
      group.querySelectorAll(".radio-btn").forEach(btn => {
        if (parseFloat(btn.dataset.value) === state[key]) btn.classList.add("active");
      });
    }
  });

  updateScore();

  setTimeout(() => {
    const score = calcTugScore();
    if (score !== null) showResult(score);
  }, 300);
}
