/* Plain anchors are intentional: vinext currently throws an invalid-hook error for next/link in the shared shell. */
/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

async function requestOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }

  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000")
    .split(",")[0]
    .trim();
  const protocol = (requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https"))
    .split(",")[0]
    .trim();

  return new URL(`${protocol}://${host}`);
}

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = await requestOrigin();
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: { default: "Spanish Lab · DELE B2", template: "%s | Spanish Lab" },
    description: "한국어로 이해하고 연습하는 무료 DELE B2 학습 도구. 공식 자료 링크, 창작 연습문항, 오답 복습을 제공합니다.",
    applicationName: "Spanish Lab · DELE B2",
    alternates: { canonical: metadataBase },
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

const nav = [
  ["공식 자료", "/materials"],
  ["연습", "/practice"],
  ["복습", "/review"],
  ["시험 가이드", "/guide"],
] as const;

function Header() {
  return <header className="site-header">
    <div className="site-shell header-row">
      <a className="brand" href="/" aria-label="Spanish Lab DELE B2 홈">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span className="brand-copy"><strong>Spanish Lab · DELE B2</strong><span>스페인어 연구소</span></span>
      </a>
      <nav className="site-nav desktop-nav" aria-label="주요 메뉴">
        {nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <ThemeToggle />
    </div>
    <nav className="mobile-nav" aria-label="모바일 메뉴"><div className="site-shell">{nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div></nav>
  </header>;
}

function Footer() {
  return <footer className="site-footer"><div className="site-shell footer-grid">
    <div><a className="brand" href="/"><span className="brand-mark" aria-hidden="true">S</span><span className="brand-copy"><strong>Spanish Lab</strong><span>DELE B2 연구 노트</span></span></a>
      <div className="footer-links"><a href="https://www.youtube.com/@spanishlabkr" target="_blank" rel="noreferrer">YouTube @spanishlabkr ↗</a><a href="/guide">시험 가이드</a></div>
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
  return <html lang="ko" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><Header /><main id="main-content">{children}</main><Footer /></body></html>;
}
