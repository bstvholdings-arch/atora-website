# 上线步骤 · Deploy to atora.com.my

代码已就绪并提交（本地，尚未推送）：

- `d8c48dd` feat: GEO + AI search optimization (JSON-LD, llms.txt, robots/sitemap, hreflang, content hub)
- `3e33863` feat: product image upload in New Product modal + Storage delete + placeholder
- `abe612d` feat(products/about): mobile 1-col featured grid, product photo album, About story + gallery

沙箱无法向 GitHub 鉴权（GCM 浏览器认证），**以下第 1 步需在你本地已登录 GitHub 的终端执行**。

---

## 1. 推送代码

```bash
cd <项目目录>
git push origin main
```

> 3 个提交，fast-forward，无需 force。推送后如果 Vercel 已连接 `main` 分支会自动触发部署。

## 2. Vercel 环境变量（必须设置，否则上传不持久）

Vercel 控制台 → 项目 `atora-website` → **Settings → Environment Variables**，添加（Production 勾选）：

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://umnnzabvivodfqzyfnco.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<你提供的 service_role JWT>` |

> `SUPABASE_BUCKET`（默认 `media`）与 `SUPABASE_PRODUCT_IMAGES_BUCKET`（默认 `product-images`）代码里有默认值，**可不填**。
> 不设置 `SUPABASE_SERVICE_ROLE_KEY` 的话，上传会回退到本地磁盘，Vercel serverless 文件系统不持久，图片会上传成功但**重启/重新部署后丢失**。

## 3. 部署

- 若 Vercel 已连 `main` 分支：第 1 步 push 后自动部署，跳过本步。
- 否则手动部署：
  ```bash
  npm i -g vercel
  vercel login
  vercel --prod
  ```

## 4. 上线后验证

1. 打开 `atora.com.my/admin` → 点 **+ Add Product**
2. 在 *Specifications* 正下方找到 **Product Images** → 选多张图（JPG/PNG/WEBP，≤8MB）→ 自动上传出预览
3. 每张右上角 **×** 删除（同时删 Storage 文件）；"Set cover" 设封面（第一张默认封面）
4. 保存 → 前台 `/products` 列表与商品详情页自动显示这些图；无图商品显示占位图
5. 编辑任意商品 → 底部「产品相册」删一张图，确认 Supabase Storage 里对应文件也消失（避免孤儿文件）

---

### 本地先行验证（不部署也能看）

```bash
cd <项目目录>
npm run dev
# 打开 http://localhost:3000/admin → + Add Product
```

本地 `.env.local` 已配好 `SUPABASE_SERVICE_ROLE_KEY`，上传会真实写入 Supabase Storage。
