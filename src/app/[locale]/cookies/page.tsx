// import type { Metadata } from "next";
// import { getTranslations, setRequestLocale } from "next-intl/server";
// import { SiteNav } from "@/components/SiteNav";
// import { Footer } from "@/components/Footer";
// import { LegalPage, type LegalSection } from "@/components/LegalPage";
// import { legalMetadata } from "@/lib/page-metadata";
// import { LEGAL_DATA } from "@/lib/legal-data";

// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ locale: string }>;
// }): Promise<Metadata> {
//   const { locale } = await params;
//   return legalMetadata(locale, "cookies", "/cookies");
// }

// export default async function CookiesPage({
//   params,
// }: {
//   params: Promise<{ locale: string }>;
// }) {
//   const { locale } = await params;
//   setRequestLocale(locale);

//   const t = await getTranslations({ locale, namespace: "legal" });

//   // NOTE: No cookie-consent banner is rendered — the site uses only necessary
//   // technical/preference cookies, which don't require prior consent. If analytics,
//   // advertising or other third-party (non-technical) cookies are added later, a
//   // consent banner + management UI MUST be introduced before they fire, and the
//   // "consent" copy below updated accordingly.
//   const sections: LegalSection[] = [
//     { heading: t("cookies.whatTitle"), paragraphs: [t("cookies.whatBody")] },
//     {
//       heading: t("cookies.typesTitle"),
//       paragraphs: [t("cookies.typesBody"), t("cookies.consentBody")],
//     },
//     { heading: t("cookies.manageTitle"), paragraphs: [t("cookies.manageBody")] },
//   ];

//   return (
//     <>
//       <SiteNav />
//       <main>
//         <LegalPage
//           title={t("cookies.title")}
//           lastUpdatedLabel={t("lastUpdated")}
//           lastUpdated={LEGAL_DATA.lastUpdated}
//           intro={t("cookies.intro")}
//           sections={sections}
//           backLabel={t("backHome")}
//         />
//       </main>
//       <Footer />
//     </>
//   );
// }
