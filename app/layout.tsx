import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

import { requestOrigin, absoluteUrl, sitePath } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const metadataBaseUrl = await requestOrigin();
  const metadataBase = new URL(metadataBaseUrl);
  // OG images and canonical use absoluteUrl to ensure basePath is included if needed
  // Note: the original code just used metadataBase. For export, absoluteUrl is safer.
  const canonicalUrl = absoluteUrl("/", metadataBaseUrl);
  const socialImage = absoluteUrl("/og.png", metadataBaseUrl);

  return {
    metadataBase,
    title: { default: "Spanish Lab · DELE B2", template: "%s | Spanish Lab" },
    description: "한국어로 이해하고 연습하는 무료 DELE B2 학습 도구. 공식 자료 링크, 창작 연습문항, 오답 복습을 제공합니다.",
    applicationName: "Spanish Lab · DELE B2",
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: "Spanish Lab · DELE B2",
      title: "Spanish Lab · DELE B2",
      description: "기출 유형을 한국어로 이해하고, 짧게 연습하고, 다시 복습하세요.",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Spanish Lab · DELE B2" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Spanish Lab · DELE B2",
      description: "한국어 사용자를 위한 무료 DELE B2 학습 도구",
      images: [socialImage],
    },
  };
}

function Footer() {
  return <footer className="site-footer"><div className="site-shell footer-grid">
    <div><a className="brand" href={sitePath("/")}><span className="brand-mark" aria-hidden="true">S</span><span className="brand-copy"><strong>Spanish Lab</strong><span>DELE B2 연구 노트</span></span></a>
      <div className="footer-links"><a href="https://www.youtube.com/@spanishlabkr" target="_blank" rel="noreferrer">YouTube @spanishlabkr ↗</a><a href={sitePath("/guide")}>시험 가이드</a></div>
    </div>
    <div className="footer-notes">
      <p>Spanish Lab · DELE B2는 Spanish Lab · 스페인어 연구소가 제작한 비공식 학습 도구이며 Instituto Cervantes와 제휴·보증 관계가 없습니다.</p>
      <p>DELE 명칭과 관련 표지는 Instituto Cervantes 또는 해당 권리자의 권리 대상입니다. 공식 자료는 재호스팅하지 않고 원문 링크만 제공합니다.</p>
      <p>학습 진도와 테마 설정은 이 기기의 브라우저에만 저장되며 서버로 전송되지 않습니다. 마이크 녹음은 현재 브라우저 세션에서만 처리되며 업로드되지 않습니다.</p>
    </div>
  </div></footer>;
}

const themeScript = `(function(){try{var v=localStorage.getItem('dele-b2:theme:v1');var t=v==='dark'||v==='light'?v:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><SiteHeader /><main id="main-content">{children}</main><Footer /></body></html>;
}
