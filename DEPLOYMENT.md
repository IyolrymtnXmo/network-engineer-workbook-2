# คู่มือ Deploy ขึ้น GitHub Pages (CI/CD)

เอกสารนี้อธิบายขั้นตอนการนำ Workbook ขึ้น GitHub และเปิดใช้ระบบ Deploy อัตโนมัติ (CI/CD)
เพื่อให้คนอื่นเข้าใช้งานเว็บได้ผ่านลิงก์สาธารณะ

## ภาพรวมระบบ

```
แก้ไฟล์ในเครื่อง ──> git commit ──> git push (main)
                                        │
                                        ▼
                        GitHub Actions (.github/workflows/deploy.yml)
                                        │
                        ┌───────────────┴───────────────┐
                        ▼                               ▼
                 Job "validate"                   Job "deploy"
          - เช็คไฟล์ครบทุกหน้า              - อัปโหลดไฟล์ทั้ง repo
          - ตรวจ HTML tag ปิดครบ            - deploy ขึ้น GitHub Pages
          - ตรวจลิงก์ภายในไม่มีลิงก์เสีย
                                        │
                                        ▼
                    https://<username>.github.io/<repo>/
```

- เว็บนี้เป็น **static site ล้วน** (HTML/CSS/JS) ไม่ต้อง build ไม่ต้องติดตั้ง dependency ใด ๆ
- ทุกครั้งที่ push ขึ้น `main` ระบบจะตรวจสอบไฟล์แล้ว deploy ให้อัตโนมัติ
- ถ้าการตรวจสอบ (validate) ไม่ผ่าน ระบบจะ **ไม่ deploy** — เว็บเวอร์ชันเดิมยังใช้งานได้ตามปกติ

## ขั้นตอนการ Deploy ครั้งแรก

### ขั้นที่ 1 — ตรวจสอบ remote ของ repo

Repo นี้ผูกกับ GitHub อยู่แล้ว ตรวจสอบด้วย:

```bash
git remote -v
# origin  git@github.com:IyolrymtnXmo/network-engineer-workbook-2.git (fetch)
# origin  git@github.com:IyolrymtnXmo/network-engineer-workbook-2.git (push)
```

> ถ้ายังไม่มี repo บน GitHub: สร้าง repo ใหม่ที่ https://github.com/new
> แล้วผูก remote ด้วย `git remote add origin git@github.com:<username>/<repo>.git`

### ขั้นที่ 2 — Push โค้ดขึ้น GitHub

```bash
git status                      # ดูว่ามีไฟล์อะไรเปลี่ยนบ้าง
git add .                       # stage ทุกไฟล์
git commit -m "Add workbook website with CI/CD"
git push -u origin main         # push ขึ้น branch main
```

### ขั้นที่ 3 — เปิดใช้ GitHub Pages (ทำครั้งเดียว)

1. เปิดหน้า repo บน GitHub → แท็บ **Settings**
2. เมนูซ้าย เลือก **Pages**
3. หัวข้อ **Build and deployment** → **Source** → เลือก **GitHub Actions**
   (ค่าเริ่มต้นคือ "Deploy from a branch" — ต้องเปลี่ยนเป็น GitHub Actions เท่านั้น workflow ถึงจะ deploy ได้)

### ขั้นที่ 4 — รอ workflow ทำงานและตรวจผล

1. ไปที่แท็บ **Actions** ของ repo
2. จะเห็น workflow **"Deploy to GitHub Pages"** กำลังรัน (จาก push ในขั้นที่ 2)
   - ถ้า push ก่อนเปิด Pages ให้กด **Re-run all jobs** หรือรันเองผ่านปุ่ม **Run workflow**
3. รอจนขึ้นเครื่องหมายถูกสีเขียวทั้ง 2 jobs (`validate` และ `deploy`)
4. เว็บจะออนไลน์ที่:

```
https://iyolrymtnxmo.github.io/network-engineer-workbook-2/
```

(URL จริงดูได้จากผลลัพธ์ของ job `deploy` หรือหน้า Settings → Pages)

## การอัปเดตเนื้อหาหลังจากนี้

แก้ไฟล์ → commit → push แค่นั้น ระบบจัดการที่เหลือให้:

```bash
git add <ไฟล์ที่แก้>
git commit -m "Update lab 3: fix trunk explanation"
git push
```

ประมาณ 1–2 นาที เว็บจะอัปเดตเป็นเวอร์ชันใหม่

## การทดสอบเว็บในเครื่องก่อน push

ไม่ต้องติดตั้งอะไรเพิ่ม ใช้ Python ที่มีอยู่แล้วได้เลย:

```bash
cd network-engineer-workbook-2
python3 -m http.server 8000
# เปิดเบราว์เซอร์ที่ http://localhost:8000
```

## โครงสร้างไฟล์ที่เกี่ยวกับการ Deploy

| ไฟล์ | หน้าที่ |
|---|---|
| `.github/workflows/deploy.yml` | ตัว CI/CD pipeline: validate + deploy อัตโนมัติเมื่อ push `main` |
| `.nojekyll` | บอก GitHub Pages ไม่ต้องประมวลผลด้วย Jekyll (เสิร์ฟไฟล์ตรง ๆ) |
| `index.html`, `labs/`, `assets/` | ตัวเว็บทั้งหมด (static ล้วน) |

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| Actions ขึ้น error `Get Pages site failed` หรือ `Not Found` | ยังไม่ได้ตั้ง Source เป็น **GitHub Actions** ในขั้นที่ 3 — ตั้งแล้วกด Re-run |
| push แล้วเว็บไม่เปลี่ยน | ดูแท็บ Actions ว่า job `validate` แดงหรือไม่ (มักเป็น HTML ปิด tag ไม่ครบหรือลิงก์เสีย — อ่าน error ใน log ระบุไฟล์และบรรทัดให้แล้ว) |
| เปิดเว็บแล้ว CSS ไม่ขึ้น | ตรวจว่าอ้าง asset แบบ relative path (`assets/...` หรือ `../assets/...`) ห้ามขึ้นต้นด้วย `/` เพราะเว็บอยู่ใต้ subpath `/network-engineer-workbook-2/` |
| แก้ typo เล็กน้อยอยากรัน deploy ใหม่โดยไม่ push | แท็บ Actions → เลือก workflow → ปุ่ม **Run workflow** (มี `workflow_dispatch` เปิดไว้แล้ว) |
| อยากใช้โดเมนตัวเอง | Settings → Pages → Custom domain (ต้องตั้ง DNS CNAME ชี้มาที่ `<username>.github.io`) |

## สำหรับคนอื่นที่อยากนำ Workbook ไปใช้

1. กด **Fork** repo นี้ไปยังบัญชีตัวเอง
2. เปิด Settings → Pages → Source: **GitHub Actions** (ขั้นที่ 3 ด้านบน)
3. แท็บ Actions → กด **Run workflow** หนึ่งครั้ง (หรือ push อะไรก็ได้ขึ้น `main`)
4. ได้เว็บของตัวเองที่ `https://<username>.github.io/<ชื่อ-repo>/`
