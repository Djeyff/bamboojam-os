# 🌴 BamboojamVilla OS

Vacation rental management system for **BamboojamVilla**, Punta Cana, DR.

> Same dark navy + gold theme as Construction OS — separate codebase, separate deployment.

---

## Revenue Split

| Person | Share | Formula |
|--------|-------|---------|
| **Sylvie** | 15% | 15% of Net Revenue (Revenue − Expenses) |
| **Jeff** | 42.5% | 50% of the remaining 85% |
| **Fred** | 42.5% | 50% of the remaining 85% |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — KPIs, splits, recent activity |
| `/expenses` | All expenses — filter by year/category/source |
| `/revenues` | All revenues — monthly chart + table |
| `/periods` | Period settlements — historical split calculations |
| `/sylvieledger` | Sylvie's personal ledger with running balance |
| `/fredledger` | Fred's expense ledger by type |

---

## Databases (Notion)

| Database | ID |
|----------|----|
| 💰 Expenses | `30f00b56-b6fa-818d-aca5-dc439e037164` |
| 📈 Revenues | `30f00b56-b6fa-81a5-98bd-d6d35f6b412d` |
| 📊 Period Settlements | `30f00b56-b6fa-81b9-ac45-f12abbb7f2c8` |
| 👤 Sylvie Ledger | `30f00b56-b6fa-81f9-b6ed-fb7818432ae2` |
| 👤 Fred Ledger | `30f00b56-b6fa-81f5-a6e1-f2e42d35d283` |

---

## Deploy to Vercel

### Required Environment Variables

```
NOTION_TOKEN=secret_xxxxx

BAMBOOJAM_CONFIG={"databases":{"expenses":"30f00b56-b6fa-818d-aca5-dc439e037164","revenues":"30f00b56-b6fa-81a5-98bd-d6d35f6b412d","periods":"30f00b56-b6fa-81b9-ac45-f12abbb7f2c8","sylvieLedger":"30f00b56-b6fa-81f9-b6ed-fb7818432ae2","fredLedger":"30f00b56-b6fa-81f5-a6e1-f2e42d35d283"}}
```

---

## CLI Usage

```bash
cd /path/to/workspace/app/skills/bamboojam

# Add an expense
node bamboojam-cli.js expense "Luz y fuerza" 4500

# Add a revenue
node bamboojam-cli.js revenue "Airbnb booking - Smith family" 85000 2026-03-01

# Check current status + splits
node bamboojam-cli.js status

# Close a period and calculate splits
node bamboojam-cli.js close-period 2026-01-01 2026-03-31

# View ledgers
node bamboojam-cli.js sylvie-ledger
node bamboojam-cli.js fred-ledger

# Full statement
node bamboojam-cli.js statement sylvie
node bamboojam-cli.js statement fred
```

---

## Import Historical Data (Google Sheets)

```bash
cd /path/to/workspace/app/skills/bamboojam

# Dry run first
node import-sheets.js --dry-run --all

# Import everything
node import-sheets.js --all

# Import specific sections
node import-sheets.js --expenses
node import-sheets.js --revenues
node import-sheets.js --sylvie-ledger
node import-sheets.js --fred-ledger
node import-sheets.js --period-settlements
```

---

## Data Sources

- **Sylvie's Sheet** `1Zom5Guy8fMYYobdRx8QeZU39uHMA7RjT814MYFwXlgs`
  - `S -dépenses depuis ouverture` — Operating expenses since 2020
  - `S- revenus depuis ouverture` — Revenues since 2020
  - `Repartition - Sylvie` — Period settlement history
  - `Sylvie - Hors des comptes` — Sylvie's personal ledger
  - `Sylvie Travaux` — Construction/renovation expenses

- **Fred's Sheet** `1LpZs_ySVtp5WnH9_tEsi_Oc583ZidiFskqL1md4vKdY`
  - `Fred` — Fred's expense ledger + settlements

---

*Google Sheets = historical record. Notion = live system going forward.*
