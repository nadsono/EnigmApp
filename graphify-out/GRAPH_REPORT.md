# Graph Report - Enigma Gestão (Produção)  (2026-11-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 556 nodes · 1642 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `134ee586`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EnigmaContext.tsx
- App.tsx
- ConfiguracoesScreen.tsx
- schema.ts
- EntradasScreen.tsx
- uiTheme.ts
- ledger.ts
- EnigmaProvider
- package.json
- auditar.mjs
- CryptoNetworkManager.tsx
- dependencies
- compilerOptions
- MANIFEST.json
- middleware/auth.ts
- scripts
- firebase.ts
- interface
- dotenv
- express
- react-dom

## God Nodes (most connected - your core abstractions)
1. `EnigmaProvider()` - 55 edges
2. `EnigmaContextValue` - 43 edges
3. `useEnigma()` - 38 edges
4. `formatCurrencyBRL()` - 36 edges
5. `roundCurrency()` - 33 edges
6. `react` - 26 edges
7. `evaluateBetEntry()` - 25 edges
8. `ConfiguracoesScreen()` - 21 edges
9. `EntradasScreen()` - 21 edges
10. `formatBrlEquivalent()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `PendingWalletChange` --references--> `BankAccount`  [EXTRACTED]
  src/screens/ParceriasScreen.tsx → src/domain/types.ts
- `EnigmaContextValue` --references--> `AddCatalogCriterionInput`  [EXTRACTED]
  src/context/EnigmaContext.tsx → src/domain/catalog.ts
- `EnigmaContextValue` --references--> `computeGlobalSummary()`  [EXTRACTED]
  src/context/EnigmaContext.tsx → src/domain/ledger.ts
- `EnigmaContextValue` --references--> `ScreenId`  [EXTRACTED]
  src/context/EnigmaContext.tsx → src/domain/types.ts
- `PersistedPeriodState` --references--> `DateRangePreset`  [EXTRACTED]
  src/context/EnigmaContext.tsx → src/domain/types.ts

## Import Cycles
- None detected.

## Communities (21 total, 1 thin omitted)

### Community 0 - "EnigmaContext.tsx"
Cohesion: 0.07
Nodes (78): EnigmaContext, EnigmaContextValue, NavigationFocus, PersistedPeriodState, CleanProductionStateBundle, PRODUCTION_BASE_MODE_STORAGE_KEY, PROJECT_DATABASE_BOOT_MODE, AuthAttemptResult (+70 more)

### Community 1 - "App.tsx"
Cohesion: 0.08
Nodes (63): lucide-react, react, App(), CASH_SECTIONS, EnigmaWorkspace(), FINANCE_SECTIONS, IsolatedMaintenanceConsole(), OVERVIEW_SECTIONS (+55 more)

### Community 2 - "ConfiguracoesScreen.tsx"
Cohesion: 0.10
Nodes (45): RFC-4180, ENIGMA_DATABASE_MIGRATIONS, escapeSqlLiteral(), generateLiveUsersSqlMigration(), buildUserPersistenceSnapshot(), computeUsersChecksum(), deserializeUsersPersistenceJson(), enrichUserWithPersistenceMetadata() (+37 more)

### Community 3 - "schema.ts"
Cohesion: 0.06
Nodes (30): drizzle-orm@^0.45.4, drizzle-orm, db, pool, accountOperatorPermissions, bankAccounts, bankAccountsRelations, betEntries (+22 more)

### Community 4 - "EntradasScreen.tsx"
Cohesion: 0.09
Nodes (36): SocialProofCase, canAccountStartNewOperation(), formatHouseAccountBalance(), formatShortHouseName(), allocateOperationCapital(), calculateCapital(), canApplyAutomaticCapital(), CapitalAccount (+28 more)

### Community 5 - "uiTheme.ts"
Cohesion: 0.12
Nodes (30): AppearanceChoice(), AppearanceSettings(), THEMES, CatalogManagerPanel(), CatalogSectionTab, AppearanceContext, AppearanceContextValue, AppearanceProvider() (+22 more)

### Community 6 - "ledger.ts"
Cohesion: 0.11
Nodes (29): loadPersistedPeriodState(), computeGlobalSummary(), currentCurrencyDisplayMode, currentEurUsdtRate, currentUsdtBrlRate, EntryEvaluation, filterByUserPermission(), formatIsoDateBR() (+21 more)

### Community 7 - "EnigmaProvider"
Cohesion: 0.16
Nodes (26): EnigmaProvider(), buildCatalogPersistenceSnapshot(), CATALOG_REPOSITORY_STORAGE_KEY, CATALOG_SCHEMA_VERSION, computeCatalogChecksum(), loadCatalogFromRepository(), saveCatalogToRepository(), DatabaseMigrationItem (+18 more)

### Community 8 - "package.json"
Cohesion: 0.11
Nodes (25): devDependencies, autoprefixer@^10.4.21, esbuild@^0.25.0, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/pg@^8.23.1 (+17 more)

### Community 9 - "auditar.mjs"
Cohesion: 0.10
Nodes (13): args, arquivos(), ehCss(), EXT, familias, JSON_OUT, porArquivo, resultado (+5 more)

### Community 10 - "CryptoNetworkManager.tsx"
Cohesion: 0.21
Nodes (19): CryptoNetworkManager(), CryptoNetworkSelect(), CryptoRouteFields(), getSnapshot(), NetworkSelectProps, subscribe(), useCryptoNetworks(), addCryptoNetwork() (+11 more)

### Community 11 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, pg@^8.23.1, react@^19.0.1, @supabase/supabase-js@^2.118.0, @tailwindcss/vite@^4.3.3 (+9 more)

### Community 12 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 13 - "MANIFEST.json"
Cohesion: 0.17
Nodes (11): designAuthority, designStack, commit, license, version, evidenceMode, included, name (+3 more)

### Community 14 - "middleware/auth.ts"
Cohesion: 0.32
Nodes (4): firebase-admin@^14.5.0, firebase-admin, adminAuth, AuthRequest

### Community 15 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, clean, dev, lint, preview, start

### Community 16 - "firebase.ts"
Cohesion: 0.33
Nodes (5): firebase@^13.1.0, firebase, app, auth, googleAuthProvider

### Community 17 - "interface"
Cohesion: 0.40
Nodes (4): interface, default_prompt, display_name, short_description

### Community 18 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^17.2.3, drizzle-kit@^0.31.11, dotenv, drizzle-kit

### Community 19 - "express"
Cohesion: 0.40
Nodes (4): express@^4.21.2, express, app, startServer()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-4180`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 157 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `EnigmaContext.tsx`, `ConfiguracoesScreen.tsx`, `EntradasScreen.tsx`, `uiTheme.ts`, `package.json`, `CryptoNetworkManager.tsx`, `dependencies`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **What connects `RFC-4180` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `EnigmaContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07226890756302522 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `App.tsx` to `ConfiguracoesScreen.tsx`, `EntradasScreen.tsx`, `uiTheme.ts`, `package.json`, `dependencies`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08395061728395062 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `schema.ts`, `package.json`, `middleware/auth.ts`, `firebase.ts`, `dotenv`, `express`, `react-dom`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `ConfiguracoesScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0988235294117647 - nodes in this community are weakly interconnected._