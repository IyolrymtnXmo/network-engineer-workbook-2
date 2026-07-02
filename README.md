# Network Engineer Workbook 🌐

**Cisco-style Workbook ภาษาไทย** สำหรับเด็กฝึกงานสาย Network / Security Engineer —
เว็บไซต์ฝึกปฏิบัติครบ 10 Labs สไตล์ Cisco NetAcad / เอกสารอบรมภายในบริษัท System Integrator
เน้น **การคิดแบบ Engineer** ไม่ใช่การท่องจำคำสั่ง

> 🌍 **เข้าใช้งานเว็บ:** https://iyolrymtnxmo.github.io/network-engineer-workbook-2/
> (ดูขั้นตอนเปิดใช้งานครั้งแรกใน [DEPLOYMENT.md](DEPLOYMENT.md))

## มีอะไรอยู่ในนี้

ทุก Lab ประกอบด้วย 11 ส่วนตามแนวทางเอกสารอบรมจริง:
Learning Objectives · Network Topology (ASCII) · Addressing Table · Lab Guide ·
Configuration Tasks · Verification · Troubleshooting · Packet Flow ·
Reviewer Questions · **Hidden Traps (จุดผิดซ่อนไว้เหมือนข้อสอบจริง)** · Answer Key แยกจากโจทย์

| Lab | หัวข้อ | ระดับ | เวลา |
|---|---|---|---|
| 01 | Static Routing พื้นฐาน | พื้นฐาน | 60 นาที |
| 02 | Static + Default Route และ Longest Prefix Match | พื้นฐาน–กลาง | 75 นาที |
| 03 | VLAN และ Trunking | พื้นฐาน | 60 นาที |
| 04 | Router-on-a-Stick | กลาง | 75 นาที |
| 05 | Inter-VLAN Routing ด้วย Layer 3 Switch (SVI) | กลาง | 90 นาที |
| 06 | ARP และ MAC Address Table เจาะลึก | กลาง | 75 นาที |
| 07 | Layer 2 Troubleshooting (fault 5 จุด) | กลาง–สูง | 90 นาที |
| 08 | Layer 3 Troubleshooting (fault 5 จุด) | กลาง–สูง | 90 นาที |
| 09 | Mixed Troubleshooting L1–L3 (fault 7 จุด) | สูง | 120 นาที |
| 10 | Final Assessment — VLSM Design + Config + กู้ระบบ + สัมภาษณ์ | ข้อสอบรวบยอด | 150 นาที |

พร้อมเอกสารประกอบ:

- **[ทฤษฎีพื้นฐาน](fundamentals.html)** — OSI, L2 switching, VLAN, ARP, routing table, Longest Prefix Match, Packet Flow ฉบับสมบูรณ์, วิธีคิด troubleshooting
- **[Command Reference](commands.html)** — คำสั่ง Cisco IOS ทุกคำสั่งที่ใช้ พร้อมตัวอย่าง output วิธีอ่าน และ red flags

## ฟีเจอร์ของเว็บ

- 🎯 **เฉลยถูกล็อกแยกจากโจทย์** — คลิกเปิดทีละส่วนเมื่อพร้อม ป้องกันเผลอเห็นเฉลย
- 🪤 **Hidden Traps** — ทุก Lab ฝังจุดผิดไว้ในโจทย์/ตาราง/config เหมือนข้อสอบจริง
- ✅ **ติดตามความคืบหน้า** — ติ๊กงานที่ทำเสร็จและทำเครื่องหมายจบ Lab เก็บในเบราว์เซอร์ (localStorage)
- 🌙 **โหมดสว่าง/มืด** และรองรับมือถือ
- 🖨 **สั่งพิมพ์ได้** — เฉลยกางออกอัตโนมัติตอนพิมพ์ เหมาะทำเป็นเล่ม
- ⚡ **Static site ล้วน** — ไม่มี build step, deploy อัตโนมัติผ่าน GitHub Actions

## เริ่มใช้งาน

**อ่านออนไลน์:** เปิดลิงก์เว็บด้านบน แล้วทำตามหน้า "วิธีใช้ Workbook นี้ให้ได้ผลจริง"

**รันในเครื่อง:**

```bash
git clone https://github.com/IyolrymtnXmo/network-engineer-workbook-2.git
cd network-engineer-workbook-2
python3 -m http.server 8000
# เปิด http://localhost:8000
```

**เครื่องมือทำ Lab:** Cisco Packet Tracer (แนะนำสำหรับผู้เริ่มต้น), GNS3 หรือ EVE-NG + IOSv

## โครงสร้างโปรเจกต์

```
├── index.html                  # หน้าแรก: ภาพรวม, วิธีใช้, ความคืบหน้า, รายการ lab
├── fundamentals.html           # ทฤษฎีพื้นฐานทั้งหมด
├── commands.html               # คู่มือคำสั่ง Cisco IOS
├── labs/
│   ├── lab01.html … lab10.html # Lab ทั้ง 10 (โครงสร้าง 11 section ต่อ lab)
├── assets/
│   ├── css/style.css           # design system ทั้งเว็บ (ธีมสว่าง/มืด, print)
│   └── js/main.js              # TOC scroll-spy, เฉลยแบบล็อก, ระบบความคืบหน้า
├── templates/lab-template.html # โครงสำหรับเขียน lab เพิ่มในอนาคต
├── .github/workflows/deploy.yml# CI/CD: validate HTML/ลิงก์ + deploy GitHub Pages
├── DEPLOYMENT.md               # คู่มือ deploy + แก้ปัญหา (ภาษาไทย)
└── Context_prompt.md           # requirement ต้นทางของโปรเจกต์
```

## การมีส่วนร่วม / นำไปใช้ต่อ

Fork ได้เลย — เปิด GitHub Pages ของตัวเองตามขั้นตอนใน [DEPLOYMENT.md](DEPLOYMENT.md)
จะเพิ่ม Lab ใหม่ให้เริ่มจาก `templates/lab-template.html` เพื่อให้โครงสร้างและสไตล์ตรงกันทั้งเว็บ

---

Designed for: Network Engineer Intern · CCNA · CCNP · System Integrator

Topics: Static Routing ✔ VLAN ✔ Router-on-a-Stick ✔ Inter-VLAN Routing ✔ Layer 2 ✔ Layer 3 ✔ ARP ✔ MAC Address Table ✔ Routing Table ✔ Packet Flow ✔ Longest Prefix Match ✔ Troubleshooting ✔ Final Assessment
