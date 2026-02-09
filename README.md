This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.




CASH-BOOK-APP
├─ .next/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  │  ├─ delete/
│  │  │  │  └─ route.ts
│  │  │  ├─ forgot-password/
│  │  │  │  └─ route.ts
│  │  │  ├─ google/
│  │  │  │  └─ route.ts
│  │  │  ├─ login/
│  │  │  │  └─ route.ts
│  │  │  ├─ register/
│  │  │  │  └─ route.ts
│  │  │  ├─ update/
│  │  │  │  └─ route.ts
│  │  │  └─ verify/
│  │  │     └─ route.ts
│  │  ├─ books/
│  │  │  ├─ [id]/
│  │  │  │  └─ route.ts
│  │  │  └─ share/
│  │  │     └─ route.ts
│  │  ├─ entries/
│  │  │  ├─ [id]/
│  │  │  │  └─ route.ts
│  │  │  ├─ all/
│  │  │  │  └─ route.ts
│  │  │  └─ status/
│  │  │     └─ [id]/
│  │  │        └─ route.ts
│  │  ├─ public/
│  │  │  └─ [token]/
│  │  │     └─ route.ts
│  │  ├─ stats/
│  │  │  └─ global/
│  │  │     └─ route.ts
│  │  ├─ user/
│  │  │  └─ settings/
│  │  │     └─ route.ts
│  │  └─ share/
│  │     └─ [token]/
│  │        └─ page.tsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ manifest.ts
│  ├─ page.tsx
│  └─ providers.tsx
├─ components/
│  ├─ Auth/
│  │  ├─ views/
│  │  │  ├─ ForgotPassView.tsx
│  │  │  ├─ LoginView.tsx
│  │  │  ├─ OtpView.tsx
│  │  │  ├─ RegisterView.tsx
│  │  │  └─ SocialAuth.tsx
│  │  ├─ AuthScreen.tsx
│  │  └─ index.ts
│  ├─ Layout/
│  │  ├─ CommandHub.tsx
│  │  ├─ DashboardLayout.tsx
│  │  ├─ DynamicHeader.tsx
│  │  └─ HubHeader.tsx
│  ├─ Modals/
│  │  ├─ AdvancedExportModal.tsx
│  │  ├─ BookModal.tsx
│  │  ├─ EntryModal.tsx
│  │  ├─ index.tsx
│  │  ├─ ModalPortal.tsx
│  │  ├─ ModalRegistry.tsx
│  │  └─ ShareModal.tsx
│  ├─ Sections/
│  │  ├─ Books/
│  │  │  ├─ BookDetails.tsx
│  │  │  ├─ BooksList.tsx
│  │  │  ├─ BooksSection.tsx
│  │  │  ├─ DetailsToolbar.tsx
│  │  │  ├─ MobileFilterSheet.tsx
│  │  │  ├─ MobileTransactionCards.tsx
│  │  │  ├─ StatsGrid.tsx
│  │  │  └─ TransactionTable.tsx
│  │  ├─ Profile/
│  │  │  ├─ DangerZone.tsx
│  │  │  ├─ DataSovereignty.tsx
│  │  │  ├─ IdentityHero.tsx
│  │  │  ├─ ProfileSection.tsx
│  │  │  ├─ ProtocolAuditLog.tsx
│  │  │  └─ SecurityForm.tsx
│  │  ├─ Reports/
│  │  │  ├─ AnalyticsHeader.tsx
│  │  │  ├─ AnalyticsStats.tsx
│  │  │  ├─ AnalyticsVisuals.tsx
│  │  │  └─ ReportsSection.tsx
│  │  ├─ Settings/
│  │  │  ├─ ExperienceModule.tsx
│  │  │  ├─ GovernanceModule.tsx
│  │  │  ├─ RegionModule.tsx
│  │  │  ├─ SettingsHeader.tsx
│  │  │  ├─ SettingsSection.tsx
│  │  │  └─ SystemMaintenance.tsx
│  │  ├─ Timeline/
│  │  │  ├─ TimelineFeed.tsx
│  │  │  ├─ TimelineMobileCards.tsx
│  │  │  ├─ TimelineSection.tsx
│  │  │  └─ TotalStats.tsx
│  │  └─ UI/
│  │     ├─ AnalyticsChart.tsx
│  │     ├─ CustomSelect.tsx
│  │     ├─ EliteDropdown.tsx
│  │     ├─ EntryRow.tsx
│  │     ├─ ExportTools.tsx
│  │     ├─ FilterBar.tsx
│  │     ├─ FormComponents.tsx
│  │     ├─ SortDropdown.tsx
│  │     ├─ Tooltip.tsx
│  │     └─ time-range-selector.tsx
│  ├─ context/
│  │  ├─ ModalContext.tsx
│  │  └─ TranslationContext.tsx
│  ├─ hooks/
│  │  ├─ useGuidance.ts
│  │  ├─ useProfile.ts
│  │  ├─ useSettings.ts
│  │  ├─ useTranslation.ts
│  │  └─ useVault.ts
│  └─ MasterTransactionCard.tsx
├─ lib/
│  ├─ utils/
│  │  └─ helpers.ts
│  └─ vault/
│     ├─ db.ts
│     ├─ exportUtils.ts
│     ├─ mail.ts
│     ├─ offlineDB.ts
│     ├─ SyncOrchestrator.ts
│     └─ translations.ts
├─ models/
│  ├─ Book.ts
│  ├─ Entry.ts
│  └─ User.ts
├─ node_modules/
├─ public/
├─ .env.local
├─ .gitignore
├─ eslint.config.mjs
├─ next-env.d.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ README.md
├─ structure.txt
├─ tailwind.config.ts
└─ tsconfig.json