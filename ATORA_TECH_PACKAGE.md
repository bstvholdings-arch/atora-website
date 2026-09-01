# ATORA 网站技术包 (Technical Package)

> 目的：把本项目的架构、GEO + AI 搜索优化层、数据层、关键约定与"如何扩展"配方集中到一份文档，
> 方便以后**改功能 / 加页面 / 加品牌 / 改 SEO** 时快速上手，避免重读全部源码或重复踩坑。
> 本文档内容均来自对本仓库代码的实地核对（非臆测）。

---

## 0. 适用范围与必读红线

本项目最初由一份 **GEO + AI Search 优化总指令 (master prompt)** 驱动，其中包含不可妥协的约束，
**任何后续改动都必须继续遵守**：

1. **不得重建 / 不得破坏**现有首页、产品目录、后台 admin、价格管理、WhatsApp、地图、合作伙伴、FAQ、多语言、已有 URL、UI。
2. **定位 = 马来西亚全国 (Nationwide Malaysia)**。Kedah / Padang Serai / Sungai Petani / Kulim 只是实体分店，不是服务范围上限。文案必须出现 "nationwide / across Malaysia / 全马"。
3. **不得声称 "official distributor" / "authorised dealer"**。只可使用 "supplies / offers / available through ATORA / independent multi-brand supplier"。
4. **严禁任何假数据 (no fake data)**。公司名、电话、地址、邮箱、品牌列表、产品、价格等**全部来自数据库 / `site_settings`**，绝不在代码里硬编码或编造。
5. 所有改动最终需 `npm run build` 通过（typecheck + lint）并本地 `curl` 验证后再上线。

---

## 1. 项目概览

| 项 | 值 |
|---|---|
| 技术栈 | Next.js 14.2.13 (App Router) · TypeScript · Tailwind · React 18 · Vercel serverless |
| 数据库 | Supabase PostgreSQL，经 `pg` Pool（`src/lib/db.ts`），无 `DATABASE_URL` 时回退 `pg-mem` |
| 对象存储 | Supabase Storage，经 `fetch`（`src/lib/storage.ts`） |
| 后台鉴权 | Cookie `atora_admin` + `getCurrentAdmin()` |
| 仓库 | `https://github.com/bstvholdings-arch/atora-website`（分支 `main`） |
| 线上域名 | `atora.com.my`（由 `NEXT_PUBLIC_SITE_URL` 决定，缺省 `https://atora.com.my`） |
| 工作目录 | `C:/Users/Sheinwong88/WorkBuddy AI/2026-08-19-17-59-28/atora-website` |

---

## 2. 目录结构与关键文件地图

```
atora-website/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                      # 根布局：默认 metadata / description
│  │  ├─ [lang]/                        # 语言段（en / bm / zh）
│  │  │  ├─ layout.tsx                  # ★ 全站 JSON-LD（Organization+WebSite+LocalBusiness）注入点
│  │  │  ├─ page.tsx                    # 首页
│  │  │  ├─ products/  products/[slug]/ # 产品目录 / 详情（含 Product+Offer+Brand 结构化数据）
│  │  │  ├─ parts/                      # 零件
│  │  │  ├─ brands/  brands/[slug]/     # 品牌列表 / 品牌详情（Brand 结构化数据）
│  │  │  ├─ technical-partners/  [slug]/# 合作伙伴（Partner 结构化数据，隐私感知）
│  │  │  ├─ locations/  about/  contact/ faq/  project-supply/
│  │  │  └─ aircond-wholesale-malaysia/ # ★ GEO 内容中心（canonical 范例页）
│  │  ├─ admin/                         # 后台（受 robots 保护，GEO 不触碰）
│  │  ├─ api/                           # API handlers（受 robots 保护）
│  │  ├─ robots.txt/route.ts           # ★ AI 爬虫白名单
│  │  ├─ sitemap.xml/route.ts          # ★ 多语言 + hreflang 站点地图
│  │  └─ llms.txt/route.ts             # ★ 给 LLM 的纯文本摘要
│  ├─ lib/
│  │  ├─ seo.ts                         # ★ 元数据核心：buildPageMetadata 等
│  │  ├─ schema.ts                      # ★ 全部 JSON-LD 构建器
│  │  ├─ i18n.ts                        # ★ LOCALES / HREFLANG_TAGS / pickLocalized / t
│  │  ├─ data.ts                        # 数据访问层（data 对象 + 分类层级工具）
│  │  ├─ db.ts                          # pg Pool + 类型（Brand/Category/FAQ/Location/Product/...）
│  │  ├─ settings.ts                    # getAllSettings() → site_settings 单行
│  │  └─ storage.ts                     # Supabase Storage 封装
│  ├─ components/
│  │  ├─ JsonLd.tsx                     # ★ 安全渲染 JSON-LD（转义 < > &）
│  │  ├─ Header.tsx  Footer.tsx  MobileBottomBar.tsx  HtmlLang.tsx
│  └─ messages/  en.json  bm.json  zh.json   # UI 文案（含品牌列表等 GEO 文案）
├─ public/                             # 静态资源（atora-logo.png 等）
├─ GEO_AUDIT_REPORT.md                 # GEO 17 项审计 + 13 项交付清单
├─ DEPLOY_STEPS.md                     # 上线步骤（push + Vercel 环境变量 + 部署）
└─ ATORA_TECH_PACKAGE.md               # 本文件
```

★ = GEO / AI 搜索优化层新增或重写的关键文件。

---

## 3. 架构要点

- **语言路由**：所有公开页在 `[lang]` 段下，`lang ∈ {en, bm, zh}`。内部代码用 `bm`，但对外 **hreflang 必须用 `ms-MY`**（见 §4.4）。
- **渲染模型**：公开页多为 Server Component（直连 DB）；后台与表单用 Server Actions；少量 API Route handlers。
- **数据获取**：统一走 `src/lib/data.ts` 的 `data` 对象（better-sqlite3 风格：`await data.xxx()`）。**不要**在页面里直接写 SQL，先加 `data` 方法。
- **配置来源**：站点级文案/SEO 默认值放在 `site_settings` 表，经 `getAllSettings()` 读取。改 SEO 文案走后台或 DB，不要硬编码进组件。
- **多语言文案**：UI 字符串放 `src/messages/{en,bm,zh}.json`，用 `t(lang, 'dot.key')` 读取。

---

## 4. GEO + AI 搜索优化层（核心交付）

### 4.1 元数据核心 — `src/lib/seo.ts`

| 导出 | 作用 |
|---|---|
| `buildPageMetadata({lang, path, title, description, images?, type?, indexable?})` | 生成整页 `Metadata`：title / description / canonical / hreflang 多语言 alternates / Open Graph / Twitter / robots / `content-language`。**所有公开页都用它**。 |
| `SITE_URL` | 站点 origin（取自 `NEXT_PUBLIC_SITE_URL`，缺省 `https://atora.com.my`，去尾斜杠） |
| `OG_LOCALE` | `og:locale` 用下划线（`en_MY`/`ms_MY`/`zh_MY`） |
| `HREFLANG_TAGS` | BCP-47 标签表（`en-MY`/`ms-MY`/`zh-MY`），从 `i18n.ts` 再导出 |
| `absoluteUrl(path)` | 相对路径 → 绝对 URL |
| `stripLocale(path)` / `hreflangUrls(path)` / `buildAlternates` | 语言回退与 alternates 计算（`buildAlternates` ≡ `langAlternates`） |
| `DEFAULT_OG_IMAGE` | 默认社交分享图 `/atora-logo.png` |

要点：`buildPageMetadata` 已自动注入 `content-language`（`en-MY`/`ms-MY`/`zh-MY`）与 `x-default` 的 hreflang alternates，`indexable:false` 时输出 `noindex`。

### 4.2 JSON-LD 构建器 — `src/lib/schema.ts`

所有公司事实均作为参数传入，**无编造、无官方经销商声明**。每个 builder 返回普通对象，交给 `<JsonLd>` 渲染。

| 构建器 | 签名（节选） | 用途 / 注入位置 |
|---|---|---|
| `organizationSchema(s, {locations?, knowsAbout?})` | `s: SiteSettings` | 全站 `Organization`，含 `areaServed: Malaysia + 各州`、`contactPoint`（含 WhatsApp）、`additionalType: WholesaleStore` |
| `websiteSchema(s)` | `s` | 全站 `WebSite`（`inLanguage` 三语） |
| `webPageSchema({lang, path, title, description?, type?, breadcrumbId?, primaryId?})` | — | 每页 `WebPage`，`isPartOf`→WebSite、`about`→Org |
| `breadcrumbSchema(path, items:[{name,url}])` | — | `BreadcrumbList` |
| `productSchema({product, brand?, category?, media?, settings, lang, path})` | — | 产品详情 `Product` + `Offer` + `Brand`；价格按 `price_display_mode` 计算，联系报价时不编造运费 |
| `serviceSchema({settings, lang, path, name, description, serviceType})` | — | `Service`（project-supply / locations / GEO hub） |
| `faqSchema(faqs: FAQ[], lang)` | — | `FAQPage`（`Question`/`Answer`） |
| `localBusinessSchema(loc, s)` | `loc: Location` | 每个 DB 分店一个 `LocalBusiness`（`branchOf`→Org） |
| `partnerOrganizationSchema(p)` | `p: TechnicalPartner` | 合作伙伴 `LocalBusiness`，**隐私感知**（按 `show_phone/show_whatsapp/show_email/show_address/show_website` 显隐字段） |
| `brandSchema({brand, lang, path, productCount})` | — | 品牌详情 `Brand`（**不**声明官方经销关系，用 `subjectOf` 指向 ATORA 供应页） |
| `itemListSchema({path, name, items:[{name,url,image?}]})` | — | `ItemList`（首页/产品/品牌/合作伙伴/hub 列表） |
| `localized(row, field, lang, fallback='')` | — | 内部助手：基于 `pickLocalized`，命中为空时回退 `fallback` |
| `clean(node)` / `ORG_ID` / `WEBSITE_ID` | — | 清理空值；稳定的 `@id` 锚点 |

类型来自 `db.ts`：`Brand, Category, FAQ, Location, Product, ProductMedia, TechnicalPartner`。

### 4.3 安全渲染 — `src/components/JsonLd.tsx`

- `jsonLdString(data)`：序列化后把 `<` `>` `&` 转义为 `\u003c \u003e \u0026`，**防止 DB 内容里出现 `</script>` 注入**。
- `<JsonLd data={...} id? />`：单个节点；`data` 可为任意对象或数组。
- `<JsonLdGraph nodes={[...]} id? />`：渲染为单个 `@graph`。

**规则：永远通过 `<JsonLd>` 渲染结构化数据，不要手写 `<script dangerouslySetInnerHTML>`。**

### 4.4 i18n 与 hreflang — `src/lib/i18n.ts`

| 导出 | 说明 |
|---|---|
| `Locale = 'en' \| 'bm' \| 'zh'`；`LOCALES` | 三语 |
| `HREFLANG_TAGS` | `{en:'en-MY', bm:'ms-MY', zh:'zh-MY'}` —— **`bm` 内部码必须映射成 `ms-MY`**，否则搜索引擎忽略/惩罚 |
| `pickLocalized(row, baseField, locale)` | 取 `field_en/_bm/_zh`，缺失回退英文，再缺失返回 `''`（**只有 3 个参数，无内联 fallback**；调用方用 `\|\| fallback`） |
| `t(locale, key, fallback?)` | 按点键取 UI 文案，回退英文 |
| `langAlternates(canonicalPath)` | 返回 `{canonical, languages}`，含 `x-default`→英文版 |
| `resolveLocale(input)` | 宽松解析语言（支持 `ms`/`malay`/`cn`/`中文` 等） |

### 4.5 全站结构化数据 — `src/app/[lang]/layout.tsx`

`LangLayout` 在每页渲染：`<JsonLd data={org}/>` + `<JsonLd data={website}/>` + 每个分店一个 `<JsonLd>`（LocalBusiness），并注入 `<HtmlLang lang={lang}/>`。`generateMetadata` 调用 `buildPageMetadata`，标题/描述取自 `site_settings` 的 `seo_default_title_*` / `seo_default_description_*`。

### 4.6 三个路由处理器（根级，无 `[lang]`）

- **`/robots.txt`**：显式 `Allow` 主流 AI 爬虫（GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-User, anthropic-ai, Google-Extended, Applebot-Extended, Amazonbot, cohere-ai, Diffbot, omgili, YouBot），并 `Disallow: /admin` `/api/` `*.env` `_next` 及带 `?q=/brand=/category=/service=` 的过滤 URL。末尾给出 `Sitemap:` 与 `LLM-Txt:`。
- **`/sitemap.xml`**：`force-dynamic`，从 DB 读取 products/brands/partners/locations + 静态页，每个 URL 输出 `xhtml:link` hreflang（en-MY/ms-MY/zh-MY/x-default），产品/品牌用真实 `updated_at/created_at` 作为 `lastmod`（无假 lastmod）。
- **`/llms.txt`**：`force-dynamic`，纯文本、DB 驱动；含公司事实、供应品类、品牌（附"independent supplier，not an official distributor or authorised dealer"声明）、全国覆盖、产品样本、合作伙伴、FAQ、关键页面链接。**全程来自 DB，无编造。**

### 4.7 GEO 内容中心 — `src/app/[lang]/aircond-wholesale-malaysia/page.tsx`

针对 "aircond wholesale Malaysia" 类查询打造的 answer-first 页面。DB 驱动（品牌/分类/产品/分店/FAQ），文案明确全国统一 + 独立多品牌供应商。注入：`BreadcrumbList` + `Service` + `ItemList`(品牌) + `FAQPage`(前 6) + `WebPage`。内部链接指向 `/[lang]/products?category=`、零件页、品牌页。

### 4.8 每页 JSON-LD 注入模式（canonical 范例）

以 GEO hub 页为例，模式固定为三步：

```tsx
// 1) generateMetadata → buildPageMetadata
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  return buildPageMetadata({ lang, path: `/${lang}${HUB_PATH}`, title: TITLE_BY_LANG[lang], description: DESC_BY_LANG[lang] });
}

// 2) 组装 JSON-LD 数组（按页面选择合适的 builder）
const jsonLd = [
  breadcrumbSchema(`/${lang}${HUB_PATH}`, [{ name: t(lang,'nav.home'), url: `/${lang}` }, { name: 'Aircond Wholesale Malaysia', url: `/${lang}${HUB_PATH}` }]),
  serviceSchema({ settings: s, lang, path: `/${lang}${HUB_PATH}`, name: `${s.company_name_en} — Aircond Wholesale Malaysia`, description: '...', serviceType: 'Air conditioner wholesale and spare parts supply' }),
  itemListSchema({ path: `/${lang}${HUB_PATH}`, name: 'Air conditioner brands supplied by ATORA across Malaysia', items: brands.map(b => ({ name: b.name_en, url: `/${lang}/brands/${b.slug}`, image: b.logo || null })) }),
  ...(faqs.length ? [faqSchema(faqs, lang)] : []),
  webPageSchema({ lang, path: `/${lang}${HUB_PATH}`, title: TITLE_BY_LANG[lang] }),
];

// 3) 在 JSX 顶部渲染（允许传数组 → 渲染多个 <script>）
return (<div><JsonLd id="aircond-wholesale-hub" data={jsonLd} /> ... </div>);
```

各页已注入的 schema 一览：

| 页面 | buildPageMetadata | 额外 JSON-LD |
|---|---|---|
| 全站 (layout) | ✅ | Organization, WebSite, LocalBusiness×(分店) |
| 首页 | ✅ | （layout 已覆盖） |
| products | ✅ | Breadcrumb, ItemList |
| products/[slug] | ✅ | Breadcrumb, **Product+Offer+Brand** |
| brands | ✅ | Breadcrumb, ItemList |
| brands/[slug] | ✅（缺失则 noindex） | Breadcrumb, **Brand**, ItemList, WebPage |
| parts | ✅ | — |
| technical-partners | ✅ | Breadcrumb, ItemList |
| technical-partners/[slug] | ✅（缺失则 noindex） | Breadcrumb, **Partner**(隐私感知), WebPage |
| locations | ✅ | Breadcrumb, LocalBusiness×(分店), Service(全国), WebPage |
| project-supply | ✅ | Breadcrumb, Service, WebPage |
| about / contact / faq | ✅ | Breadcrumb, WebPage（+ faq 页有 FAQPage） |
| aircond-wholesale-malaysia | ✅ | Breadcrumb, Service, ItemList, FAQPage, WebPage |

---

## 5. 数据层 — `src/lib/data.ts`

统一通过 `data` 对象访问（方法均为 `async`）。**新增查询先在这里加方法**，页面不要直接拼 SQL。

| 分组 | 方法 |
|---|---|
| Brands | `listActiveBrands()` · `listFeaturedBrands()` · `getBrandBySlug(slug)` · `listBrandProducts(brandId)` |
| Categories | `listActiveCategories()` · `listCategoryGroups()`（顶层分组，依赖 `effectiveParentId`）· `listChildCategories(groupId)`（含 slug 派生层级兜底）· `getCategoryBySlug(slug)` |
| Products | `listActiveProducts()` · `listFeaturedProducts(limit=8)` · `getProductBySlug(slug)` · `listProductMedia(productId)` · `searchProducts({q?, brandId?, categoryId?, groupId?, groupIds?})` |
| About | `getAboutStory()` · `listAboutPhotos()` |
| Enquiries | `listAllEnquiries()` · `listEnquiriesByStatus(status)` · `getEnquiry(id)` · `countEnquiries()` · `countEnquiriesByStatus(status)` · `createEnquiry(d)` · `updateEnquiryStatus(id,status)` · `deleteEnquiry(id)` |
| Locations | `listActiveLocations()` · `getHqLocation()` · `getLocationBySlug(slug)` |
| FAQs | `listActiveFaqs()` |
| Partners | `listActivePartners()` · `listFeaturedPartners(limit=6)` · `getPartnerBySlug(slug)` · `searchPartners({q?, city?, serviceType?})` |
| Homepage | `listHomepageSections()` |
| Counts | `counts()` → `{products, brands, categories, enquiries, partners, locations, featuredProducts, featuredPartners}` |

模块级自由函数（分类层级修复，GEO 审计中用过）：
- `effectiveParentId(category, all)`：兼容 `parent_id` 未填、靠 slug 派生的真实顶层
- `childCategoryIds(parentId, all)`：返回某分组的全部子分类 id
- `resolveBrand(...)`：产品 → 品牌解析

站点设置：`getAllSettings()`（`src/lib/settings.ts`）读取 `site_settings` 单行，返回 `Record<string,string>`，常用键：`company_name_en/_bm/_zh`、`registration_no`、`hq_phone`、`whatsapp_number`、`email`、`hq_address`、`opening_hours_en`、`facebook`、`instagram`、`tagline_en`、`seo_default_title_*`、`seo_default_description_*`、`footer_about_*`。

---

## 6. 关键约定与红线（改动前必读）

1. **无假数据**：任何公司事实（名称/电话/地址/邮箱/品牌/产品/价格）必须来自 DB 或 `site_settings`，严禁硬编码或编造。
2. **全国定位**：文案必须体现 "nationwide / across Malaysia / 全马"；分店（Padang Serai/Sungai Petani/Kulim, Kedah）只是实体点。
3. **不声称官方经销**：只用 "supplies / offers / available through ATORA / independent multi-brand supplier"。绝不出 "official distributor / authorised dealer"。
4. **品牌页只对真实品牌**：当前真实品牌 **8 个** —— Midea, Haier, Hisense, Daikin, Acson, Panasonic, AUX, **TCL**。**Mitsubishi Electric** 与 **Topaire 仅作为历史产品 SKU 存在（`products` 表，`brand_id` 为 NULL），不是目录品牌，因此刻意不建品牌页**以避免虚假经销声明。
5. `pickLocalized(row, field, locale)` 命中为空返回 `''`，调用方务必 `|| fallback`（**不要**传第 4 个参数）。
6. hreflang：内部码 `bm` 对外必须是 `ms-MY`（统一经 `HREFLANG_TAGS` / `langAlternates`）。
7. JSON-LD **必须**经 `<JsonLd>` 渲染（自动转义 `<>&`），禁止手写 `dangerouslySetInnerHTML`。
8. 改 SEO 默认值 → 改 `site_settings` 表（或后台），**不要**在 `layout.tsx` / `settings.ts` 默认值里硬编码品牌列表。

---

## 7. 如何扩展（实战配方）

**A. 新增一个公开页面（带 GEO）**
1. 在 `src/app/[lang]/<route>/page.tsx` 写组件；
2. `generateMetadata` 调 `buildPageMetadata({lang, path:'/'+lang+'/<route>', title, description})`；
3. 组装 `[breadcrumbSchema(...), webPageSchema(...), ...其他合适 builder]` 数组，`<JsonLd data={jsonLd}/>` 置于 JSX 顶部；
4. 在 `src/app/sitemap.xml/route.ts` 的 `staticPages` 数组加一行（`[ '/<route>', 优先级, changefreq ]`）；
5. 如需在 `llms.txt` 出现，其关键页面段落已自动覆盖主要路由，新页面可手动补一行。

**B. 新增一种 JSON-LD 类型**
1. 在 `src/lib/schema.ts` 增加 `xxxSchema(...)`（参数全部来自 DB/settings，无编造）；
2. 在目标页 `import` 并加入 `jsonLd` 数组；
3. 同步更新 `llms.txt` 末尾的 "Structured data" 说明行。

**C. 新增一个品牌**
1. 往 `brands` 表插入（slug、name_en/_bm/_zh、logo、description、status=1）；
2. 品牌页 `/[lang]/brands/<slug>` 与 `llms.txt` 品牌段会**自动**出现，无需改代码；
3. 若想让品牌出现在首页 featured，设 `featured=1`。

**D. 新增语言**
1. `src/lib/i18n.ts`：`LOCALES` 加码、`HREFLANG_TAGS` 加 BCP-47 映射、`messages` 加载新 json；
2. 新增 `src/messages/<code>.json`；
3. 在 `layout.tsx` / `seo.ts` 的 `OG_LOCALE` 与 `t()` 回退逻辑中补该语言。

**E. 修改 SEO 默认值 / 公司信息**
- 改 `site_settings` 表（或后台 settings）→ 经 `getAllSettings()` 全局生效。**不要**改代码里的默认值字符串。

**F. 新增产品 / 分类 / FAQ / 分店 / 合作伙伴**
- 走数据库 + 后台 admin（`/admin`），前端与 sitemap/llms.txt 会自动反映。

---

## 8. 构建 · 验证 · 部署

### 构建
```bash
cd <项目目录>
export CODEBUDDY_SAFE_DELETE_ENABLED=0   # 允许 next build 清 .next（沙箱安全删除守卫）
npm run build                            # typecheck + lint + 20 routes
```
⚠️ **`next build` 会清空 `.next`**。若此时有 `next start` 在跑且共用同一 `.next`，旧服务会返回残缺页面（JSON-LD 变空、sitemap 的 hreflang 变 0）。**构建后必须重启 `next start` 再验证。**

### 本地验证清单（curl，对着运行中的 `next start`）
```bash
curl -s localhost:3000/robots.txt | grep -E "GPTBot|ClaudeBot|Disallow: /admin"
curl -s localhost:3000/sitemap.xml | grep -c "xhtml:link"        # 应为 504
curl -s localhost:3000/llms.txt | grep -E "independent|official distributor|Midea|TCL"
curl -s localhost:3000/en | grep -oE '<link rel="alternate" hrefLang="[a-z-]+"' | head
curl -s localhost:3000/en/aircond-wholesale-malaysia | grep -oE '"@type":"[^"]*"'
curl -s localhost:3000/en/brands/tcl | grep -oE '"@type":"[^"]*"'
curl -s localhost:3000/en/products/<slug> | grep -oE '"@type":"[^"]*"'   # 含 Product/Offer/Brand
```

### 部署（详见 `DEPLOY_STEPS.md`）
1. **本机执行**（沙箱无法向 GitHub 鉴权）：`git push origin main`
2. Vercel 环境变量：`DATABASE_URL`、`NEXT_PUBLIC_SITE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（上传持久化必需）
3. 部署（连 `main` 自动或 `vercel --prod`）

---

## 9. 已知坑 (Caveats)

- `npm run start` **硬编码 `-p 3000`**，`PORT` 环境变量被忽略。
- `next build` 清空 `.next` 会干扰正在运行、共用该目录的 `next start`（见 §8）。
- **一条 FAQ 的 DB 答案仍含 "Topaire"**：该品牌是真实历史 SKU，表述属实，不算假数据，但是与 8 品牌文案唯一的轻微不一致。如需一致可修剪该 FAQ 行，或把 Mitsubishi Electric / Topaire 作为真实品牌插入 `brands` 表（品牌页会自动生成）。
- 沙箱 `git push` 被 Git Credential Manager 浏览器鉴权拦截，只能由用户本机已登录 GitHub 的终端执行。
- 品牌列表（8 个）来源为 DB `brands` 表 + `llms.txt` 实时读取；若后台增删品牌，无需改代码。

---

## 10. 本次 GEO 提交涉及的文件

提交 `2b511c2`：`feat: GEO + AI search optimization (JSON-LD, llms.txt, robots/sitemap, hreflang, content hub)`

**新增文件**
- `src/lib/seo.ts`、`src/lib/schema.ts`、`src/components/JsonLd.tsx`、`src/components/HtmlLang.tsx`
- `src/app/llms.txt/route.ts`、`src/app/[lang]/aircond-wholesale-malaysia/page.tsx`
- `GEO_AUDIT_REPORT.md`、`DEPLOY_STEPS.md`、`ATORA_TECH_PACKAGE.md`

**重写 / 修改文件**
- `src/app/[lang]/layout.tsx`（全站 JSON-LD）
- `src/app/[lang]/{about,brands,brands/[slug],contact,faq,locations,project-supply,technical-partners,technical-partners/[slug],page,parts,products,products/[slug]}/page.tsx`
- `src/app/robots.txt/route.ts`、`src/app/sitemap.xml/route.ts`、`src/app/layout.tsx`
- `src/lib/{data,i18n,settings,db}.ts`
- `src/messages/{en,bm,zh}.json`

**配套文档**：`GEO_AUDIT_REPORT.md`（17 项审计 + 13 项交付清单）、`DEPLOY_STEPS.md`（上线步骤）。

---

_维护建议：每次涉及 GEO / SEO / 数据层 / 多语言的改动后，同步更新本文件对应小节与 `GEO_AUDIT_REPORT.md`，保证技术包不过期。_
