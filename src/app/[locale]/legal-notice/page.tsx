// import type { Metadata } from "next";
// import { getTranslations, setRequestLocale } from "next-intl/server";
// import { SiteNav } from "@/components/SiteNav";
// import { Footer } from "@/components/Footer";
// import { LegalPage, type LegalSection } from "@/components/LegalPage";
// import { legalMetadata } from "@/lib/page-metadata";
// import { LEGAL_DATA, formatLegalAddress } from "@/lib/legal-data";
// import { sanityFetch } from "@/sanity/lib/live";
// import { AGENT_AICATS_QUERY } from "@/sanity/lib/queries";

// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ locale: string }>;
// }): Promise<Metadata> {
//   const { locale } = await params;
//   return legalMetadata(locale, "legal", "/legal");
// }

// export default async function LegalNoticePage({
//   params,
// }: {
//   params: Promise<{ locale: string }>;
// }) {
//   const { locale } = await params;
//   setRequestLocale(locale);

//   const t = await getTranslations({ locale, namespace: "legal" });

//   // AICAT registrations are individual, not company-level: they come from the
//   // `agent` documents. The query already drops agents without a number, so an
//   // empty result simply means the whole row is omitted.
//   const { data: aicatAgents } = await sanityFetch({ query: AGENT_AICATS_QUERY });
//   const aicatBlock = aicatAgents.length
//     ? [
//         t("fields.credentials.aicatIntro"),
//         ...aicatAgents.map((agent) => `${agent.name} — AICAT ${agent.aicat}`),
//       ].join("\n")
//     : "";

//   // Owner block — company data from LEGAL_DATA (single source of truth).
//   const ownerDetails = [
//     { label: t("fields.legalName"), value: LEGAL_DATA.legalName },
//     { label: t("fields.taxId"), value: LEGAL_DATA.taxId && LEGAL_DATA.taxId},
//     { label: t("fields.address"), value: formatLegalAddress() },
//     { label: t("fields.email"), value: LEGAL_DATA.email },
//     { label: t("fields.phone"), value: LEGAL_DATA.phone },
//     { label: t("fields.registry"), value: LEGAL_DATA.registry },
//     { label: t("fields.domain"), value: LEGAL_DATA.domain },
//     { label: t("fields.credentials.title"), value: LEGAL_DATA.credentials.npiff && t("fields.credentials.anpiff") + LEGAL_DATA.credentials.npiff },
//     { label: t("fields.credentials.aicatLabel"), value: aicatBlock }
//   ].filter(
//     (item): item is { label: string; value: string } => Boolean(item.value),
//   );

//   const sections: LegalSection[] = [
//     { heading: t("aviso.ownerTitle"), details: ownerDetails.filter(item => item.value) },
//     { heading: t("aviso.objectTitle"), paragraphs: [t("aviso.objectBody")] },
//     { heading: t("aviso.useTitle"), paragraphs: [t("aviso.useBody")] },
//     { heading: t("aviso.ipTitle"), paragraphs: [t("aviso.ipBody")] },
//     { heading: t("aviso.liabilityTitle"), paragraphs: [t("aviso.liabilityBody")] },
//     { heading: t("aviso.lawTitle"), paragraphs: [t("aviso.lawBody")] },
//   ];

//   return (
//     <>
//       <SiteNav />
//       <main>
//         <LegalPage
//           title={t("aviso.title")}
//           lastUpdatedLabel={t("lastUpdated")}
//           lastUpdated={LEGAL_DATA.lastUpdated}
//           intro={t("aviso.intro")}
//           sections={sections}
//           backLabel={t("backHome")}
//         />
//       </main>
//       <Footer />
//     </>
//   );
// }
