# نتایج زنده فوتبال

سایت نتیجه زنده (React + TypeScript + Vite) روی GitHub Pages.
داده‌ها از همان منبعی خوانده می‌شود که اپ اندروید [natijeh-app](https://github.com/sahandse/natijeh-app) استفاده می‌کند: وب‌API عمومی ورزش ۳.

## مسیر داده

`web-api.varzesh3.com/v2.0` هدر CORS برنمی‌گرداند، بنابراین مرورگر نمی‌تواند مستقیم آن را بخواند.
در عوض هر بار که سایت ساخته می‌شود، اسکریپت Node داده را می‌گیرد، به JSON نرمال‌شده تبدیل و در `public/data/` می‌نویسد؛ سایت همان فایل‌ها را از همان origin سرو می‌کند.

```
varzesh3 API → scripts/sync-data.mjs → public/data/*.json → src/services/dataApi.ts → صفحات
```

| فایل | محتوا |
| --- | --- |
| `matches.json` | بازی‌های ۵ روز (‌-۲ تا +۲) از همه لیگ‌های فعال |
| `details.json` | وقایع، آمار، ترکیب، داور و ورزشگاه بازی‌های انتخابی |
| `leagues.json` | لیگ‌ها به‌همراه اولویت (ایران اول) و فلگ `hasData` |
| `standings.json` / `scorers.json` / `fixtures.json` | جدول، گلزنان و هفته‌های هر لیگ |
| `teams.json` / `squads.json` / `players.json` | تیم‌ها، ترکیب و آمار بازیکنان |
| `meta.json` | زمان همگام‌سازی و شمارش‌ها |

منطق تبدیل در `scripts/lib/mapper.mjs` عیناً از `SportsMapper.kt` همان اپ/native کلاینت گرفته شده، پس وب و اندروید یک تفسیر از API دارند.
اپ‌های `footballApi.ts` (ESPN) فقط زمانی به‌عنوان پشتیبان مصرف می‌شوند که `public/data` خالی باشد (مثلاً build محلی بدون همگام‌سازی).

## توسعه محلی

```bash
npm ci
npm run sync:data   # یک بار همگام‌سازی (نیازمند اینترنت)
npm run dev
```

`npm run build` خودش داده نمی‌گیرد؛ برای ساخت آماده انتشار باید همگام‌سازی هم اجرا شود، کاری که workflow انجام می‌دهد.

## انتشار

`.github/workflows/deploy.yml` سه راه اجرا دارد: push روی `main`، `workflow_dispatch` دستی، و `cron` هر ۱۵ دقیقه برای تازه نگه داشتن داده‌ها.
خروجی `dist` با `peaceiris/actions-gh-pages` روی برنچ `gh-pages` منتشر می‌شود و `public/data` در مخزن commit نمی‌شود (`.gitignore`).

تازگی داده در سایت برابر است با فاصله بین دو اجرای workflow به‌علاوه کش ۱۰ دقیقه‌ای فایل‌های GitHub Pages.
cron های GitHub Actions روی مخازن غیرفعال ۶۰ روزه متوقف می‌شوند؛ با یک push یا اجرای دستی دوباره فعال می‌شوند.

## متغیرهای همگام‌سازی

| متغیر | پیش‌فرض | نقش |
| --- | --- | --- |
| `DATA_OUT_DIR` | `public/data` | مقصد نوشتن JSON |
| `DATA_OFFSETS` | `-2,-1,0,1,2` | بازه روزهای livescore |
| `DATA_MAX_LEAGUES` | `12` | چند لیگ کامل (جدول/گلزن/هفته) گرفته شود |
| `DATA_MAX_FIXTURE_PAGES` | `2` | صفحه‌های برنامه هر لیگ |
| `DATA_MAX_DETAILS` | `24` | بازی‌های دارای وقایع/آمار/ترکیب |
| `DATA_MAX_SQUADS` | `30` | تیم‌های دارای ترکیب کامل |
