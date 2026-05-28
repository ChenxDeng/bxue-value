-- Supabase 建表 SQL
-- 在 Supabase SQL Editor 中执行

CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- 用户选择
  school NUMERIC,
  major NUMERIC,
  city NUMERIC,
  location NUMERIC,
  teacher NUMERIC,
  recruit NUMERIC,
  alumni NUMERIC,
  tutor NUMERIC,
  ratio NUMERIC,
  activity NUMERIC,
  gra NUMERIC,
  attend NUMERIC,
  credit NUMERIC,
  leave_score NUMERIC,
  gpa NUMERIC,

  -- 计算结果
  score NUMERIC,
  tier TEXT,

  -- 用户信息
  ip TEXT,
  user_agent TEXT
);

-- 允许匿名插入（通过 API）
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON submissions
  FOR INSERT
  WITH CHECK (true);
