# SIGAL Health Platform

Platformë web për menaxhimin e kontratave të sigurimit shëndetësor për **SIGAL Insurance Group Kosovo**.

---

## 🚀 Quick Info

- **Frontend:** Vanilla JS/HTML/CSS → Vercel: [`sigal-platform-shendet.vercel.app`](https://sigal-platform-shendet.vercel.app)
- **Backend:** Node.js/Express → Render: `sigal-platform.onrender.com` (free + UptimeRobot ping)
- **GitHub:** `gjonbalajagon-blip/sigal-platform`
- **Local:** `C:\Users\Admin\sigal-platform`
- **Login (superadmin):** username `agon`, password `sigal2026`
- **Storage:** localStorage (Supabase i shtyrë qëllimisht - shih `docs/DECISIONS.md`)
- **Gjuha:** Shqip për UI dhe komunikim, anglisht për terma teknikë

---

## 📦 Modulet (Status)

| Moduli | Status | Shënime |
|---|---|---|
| Login | ✅ | Funksional |
| Dashboard | ⚠️ | Migruar në theme-v2, KPI icons duhen unifikuar |
| Oferta | ⚠️ | Migruar, drawer i pa-unifikuar, KPI nuk filtron |
| Oferta-View (klient) | ⚠️ | Në fazë redesign (3-col compact layout) |
| Kontratat | ✅ | **Reference module** - modeli për të tjerët |
| Faturimi | ❌ | U kthye në theme të vjetër, duhet ri-migrim |
| Rinovimet | ❌ | U kthye në theme të vjetër, dropdown bosh |
| Debitoret | ⚠️ | Stats të prishura, kolona të mungueshme |
| Raportet | ⚠️ | CSS migruar, nevojitet Chart.js për grafikët |
| Stafi | ✅ | Komplet me KPI + drawer + organogram |
| Detyrat | ❌ | Nuk është filluar |
| Produkti | ❌ | Nuk është filluar |
| Dokumentet | ❌ | Pret cloud storage |

> Për detaje më të thelluara, shih `docs/STATUS.md`

---

## 📚 Dokumentacioni

```
sigal-platform/
├── README.md              ← Ky file - HYRJE, lexohet i pari
└── docs/
    ├── STATUS.md          ← Gjendja AKTUALE (lexohet shpesh)
    ├── ARCHITECTURE.md    ← Tech stack, data models, endpoints
    ├── DESIGN-SYSTEM.md   ← theme-v2 i plotë (CSS, komponente)
    ├── PROGRESS.md        ← Timeline i milestones (vetëm gjëra të mëdha)
    └── DECISIONS.md       ← Vendimet e marra (pse X jo Y)
```

---

## 🤖 Si me përdor këtë dokumentacion (për Claude Code/AI)

### LEXOJI GJITHMONË (në çdo sesion):
- ✅ **README.md** (ky file) - status i përgjithshëm + udhëzime navigimi
- ✅ **docs/STATUS.md** - gjendja aktuale, çka po punohet, bug-et

### LEXOJI VETËM KUR JA KE NEVOJË:
- 📐 **docs/ARCHITECTURE.md** → kur shtohet/ndryshohet modul, endpoint, ose data flow
- 🎨 **docs/DESIGN-SYSTEM.md** → kur prek UI, CSS, ose komponent visual
- 🤔 **docs/DECISIONS.md** → kur dyshon "pse është kështu" para se me ndryshu
- 📜 **docs/PROGRESS.md** → vetëm për referencë historike, JO për veprime aktuale

### MOS LEXO në çdo veprim:
- ❌ PROGRESS.md (historik, nuk ndikon vendime aktuale)
- ❌ DECISIONS.md (vetëm kur ka konflikt ose dyshim)

---

## 🔄 Rregullat e Update-it (KRITIKE)

### ⚠️ UPDATE INKREMENTAL - jo në fund të sesionit!

**PSE:** Nëse PC bllokohet ose Claude Code mbyllet, humb gjithçka të padokumentuar.

**RREGULLI:** Pas ÇDO task-u të kryer (jo në fund), update file-in përkatës:

```
Task u krye → Update STATUS.md menjëherë
            → Git commit me mesazh të qartë
            → Vazhdo me task tjetër
```

### Çka shkon KU?

| Lloji i ndryshimit | Ku shkon |
|---|---|
| Mbarova modul / Migrim i madh / Milestone | **PROGRESS.md** + git |
| Vendim teknik (pse zgjodhëm X) | **DECISIONS.md** + git |
| Ndryshim arkitekture (endpoint, data model) | **ARCHITECTURE.md** + git |
| Komponent UI i ri / pattern i ri | **DESIGN-SYSTEM.md** + git |
| Bug i ri ose i rregulluar / TODO | **STATUS.md** + git |
| Bug fixes të vogla, typo, polish, spacing | **Vetëm git commit** |

### 🚨 Trigger Words (kur duhet update)

- "Pse zgjodhëm X?" → **DECISIONS.md** (nëse mungon, shto)
- "Si funksionon Y?" → **ARCHITECTURE.md** (nëse mungon, shto)
- "Ku jemi tani?" → **STATUS.md**
- "Çka kemi punuar?" → **PROGRESS.md** (vetëm milestones)
- "Si duket Z?" → **DESIGN-SYSTEM.md**

---

## ⛔ Anti-patterns (MOS BËJ)

- ❌ Mos shto "TODO" pa thanë **pse** dhe kategorinë (bug / shtyrë / paqartë)
- ❌ Mos ndrysho DESIGN-SYSTEM.md pa update tek të gjithë komponentët e prekur
- ❌ Mos hiq entry nga PROGRESS.md (vetëm shto)
- ❌ Mos modifiko DECISIONS.md ekzistuese (shto vendime të reja, mos fshi)
- ❌ Mos shto bug fixes të vogla në PROGRESS.md (përdor git commits)
- ❌ Mos përdor PowerShell `Set-Content -Encoding UTF8` (korrupton karaktere shqipe)

---

## ✅ Verification Checklist (para mbylljes së sesionit)

- [ ] STATUS.md reflekton gjendjen aktuale?
- [ ] Nëse pati milestone → ka entry në PROGRESS.md?
- [ ] Nëse pati vendim → ka entry në DECISIONS.md?
- [ ] Nëse ndryshoi arkitektura → update në ARCHITECTURE.md?
- [ ] Nëse ndryshoi UI → update në DESIGN-SYSTEM.md?
- [ ] Git commits janë të bëra (jo vetëm lokalisht ruajtur)?

---

## 🆘 Crash Recovery

Nëse PC bllokohet ose Claude Code mbyllet pa update:

```bash
# 1. Hap projektin dhe shih çka u ndryshua që nga commit i fundit
git status
git log --oneline -20

# 2. Krahaso me docs/PROGRESS.md - çka mungon?
# 3. Update STATUS.md sipas gjendjes aktuale të kodit
# 4. Shto entries të mungueshme në PROGRESS.md (nëse milestone)
```

### Recovery Prompt për Claude Code:

```
Lexo `git log --oneline -20` dhe krahaso me docs/PROGRESS.md dhe docs/STATUS.md.
Çka mungon në dokumentim? Update file-at përkatës bazuar në commits e bëra.
```

---

## 🛠️ Workflow Tipik

### Sesion i ri pune:

```bash
# 1. Pull latest
cd C:\Users\Admin\sigal-platform
git pull

# 2. Hap Claude Code dhe lexo:
#    - README.md (ky file)
#    - docs/STATUS.md

# 3. Punon...
# 4. Pas çdo task-u:
git add .
git commit -m "Përshkrim i qartë"
git push

# 5. Update STATUS.md kur task përfundon
# 6. Vazhdo
```

### Deploy:

- **Vercel** (frontend) - auto-deploy nga `git push` në `main`
- **Railway** (backend) - auto-deploy nga `git push` në `main`

> ⚠️ Railway trial mund të jetë i skaduar - shih `docs/STATUS.md` për status aktual

---

## 👥 Kontakti

- **Developer & Superadmin:** Agon Gjonbalaj (Deputy Director, SIGAL KS)
- **Email:** gjonbalajagon@gmail.com
- **GitHub:** [@gjonbalajagon-blip](https://github.com/gjonbalajagon-blip)

---

## 📌 Konventat e Projektit

- **Gjuha:** Shqip për UI/komunikim, anglisht për terma teknikë (KPI, drawer, endpoint, etj.)
- **File naming:** `oferta.js`/`oferta.html` (JO `oferte`)
- **Git commits:** Gjithmonë 3 rreshta të ndarë (`add`, `commit`, `push`)
- **localStorage keys:** `user_aktual`, `kontratat`, `ofertat`, `faturimi_klientet`, etj. (shih ARCHITECTURE.md)
- **Auth:** field `role` (jo `roli`), field `emri` (jo `emriPlote`)
- **CSS:** Hybrid - common në `theme-v2.css`, page-specific në `<style>` brenda HTML
- **Theme:** theme-v2 (glassmorphism + Montserrat + soft royal blue)

---

*Ky README mban rregullat globale. Për detaje, shih file-at në `/docs`.*
