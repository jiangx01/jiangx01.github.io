# Jiang 的笔记

个人笔记空间，记录学习、生活和思考。

https://jiangx01.github.io

## 技术栈

- HTML + CSS + JavaScript
- Supabase (云数据库)
- GitHub Pages 托管

## 部署前配置

### 1. 创建 Supabase 项目

1. 前往 [supabase.com](https://supabase.com) 注册并登录
2. 点击「New project」，填写项目名称，设置数据库密码
3. 创建完成后，进入项目 Dashboard

### 2. 创建数据表

在 Supabase 的 **SQL Editor** 中执行以下 SQL：

```sql
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT '未分类',
  content TEXT NOT NULL DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON entries FOR SELECT USING (true);
CREATE POLICY "Public insert" ON entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON entries FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON entries FOR DELETE USING (true);
```

### 3. 获取 API 密钥

1. 在 Supabase Dashboard 进入 **Project Settings** → **API**
2. 复制 **Project URL** 和 **anon public key**
3. 打开 `js/main.js`，替换文件顶部的占位符：

```js
const SUPABASE_URL = '你的 Project URL';
const SUPABASE_ANON_KEY = '你的 anon public key';
```

### 4. 部署到 GitHub Pages

```bash
git add .
git commit -m "迁移到 Supabase 数据库"
git push
```

你的 GitHub Pages 站点会自动更新，所有人访问时将共享同一份数据。
