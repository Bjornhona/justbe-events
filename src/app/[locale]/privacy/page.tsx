// import type { Metadata } from "next";
// import { getTranslations, setRequestLocale } from "next-intl/server";
// import { SiteNav } from "@/components/SiteNav";
// import { Footer } from "@/components/Footer";
// import { LegalPage, type LegalSection } from "@/components/LegalPage";
// import { legalMetadata } from "@/lib/page-metadata";
// import { LEGAL_DATA, formatLegalAddress } from "@/lib/legal-data";

// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ locale: string }>;
// }): Promise<Metadata> {
//   const { locale } = await params;
//   return legalMetadata(locale, "privacidad", "/privacy");
// }

// export default async function PrivacidadPage({
//   params,
// }: {
//   params: Promise<{ locale: string }>;
// }) {
//   const { locale } = await params;
//   setRequestLocale(locale);

//   const t = await getTranslations({ locale, namespace: "legal" });

//   // Data-controller block — company data from LEGAL_DATA (single source of truth).
//   const controllerDetails = [
//     { label: t("fields.legalName"), value: LEGAL_DATA.legalName },
//     { label: t("fields.taxId"), value: LEGAL_DATA.taxId },
//     { label: t("fields.address"), value: formatLegalAddress() },
//     { label: t("fields.email"), value: LEGAL_DATA.email },
//     { label: t("fields.phone"), value: LEGAL_DATA.phone },
//     { label: t("fields.registry"), value: LEGAL_DATA.registry },
//     { label: t("fields.domain"), value: LEGAL_DATA.domain },
//     // No credentials row here. ANPIFF is a voluntary trade association, not a
//     // public registry: listed among the data-controller's identifying details
//     // it reads as a regulatory credential it isn't. The membership badge lives
//     // in the footer instead.
//   ].filter(
//     (item): item is { label: string; value: string } => Boolean(item.value),
//   );

//   const sections: LegalSection[] = [
//     { heading: t("privacidad.responsibleTitle"), details: controllerDetails.filter(item => item.value) },
//     { heading: t("privacidad.dataTitle"), paragraphs: [t("privacidad.dataBody")] },
//     { heading: t("privacidad.purposeTitle"), paragraphs: [t("privacidad.purposeBody")] },
//     { heading: t("privacidad.legalBasisTitle"), paragraphs: [t("privacidad.legalBasisBody")] },
//     { heading: t("privacidad.retentionTitle"), paragraphs: [t("privacidad.retentionBody")] },
//     { heading: t("privacidad.sharingTitle"), paragraphs: [t("privacidad.sharingBody")] },
//     {
//       heading: t("privacidad.rightsTitle"),
//       paragraphs: [t("privacidad.rightsBody"), t("privacidad.contactBody")],
//     },
//   ];

//   return (
//     <>
//       <SiteNav />
//       <main>
//         <LegalPage
//           title={t("privacidad.title")}
//           lastUpdatedLabel={t("lastUpdated")}
//           lastUpdated={LEGAL_DATA.lastUpdated}
//           intro={t("privacidad.intro")}
//           sections={sections}
//           backLabel={t("backHome")}
//         />
//       </main>
//       <Footer />
//     </>
//   );
// }
