"use client";

/* The active passage surface follows the responsive media query after hydration. */

import { useEffect, useRef, useState } from "react";

export function ReadingWorkspace({
  title,
  titleId,
  passage,
  passageContent,
  children,
}: {
  title: string;
  titleId: string;
  passage: string;
  passageContent?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <section className="reading-workspace" aria-labelledby={titleId}>
      <div className="reading-workspace-mobile-head">
        <h2 lang="es" id={mobile ? titleId : undefined}>{title}</h2>
        <button
          ref={openerRef}
          className="button secondary small"
          type="button"
          onClick={() => dialogRef.current?.showModal()}
        >
          지문 보기
        </button>
      </div>
      <div className="reading-workspace-grid">
        {!mobile && (
          <aside className="reading-workspace-passage">
            <h2 lang="es" id={titleId}>{title}</h2>
            <div className="passage" lang="es">{passageContent ?? passage}</div>
          </aside>
        )}
        <div className="reading-workspace-questions">{children}</div>
      </div>
      {mobile && (
        <dialog
          ref={dialogRef}
          className="reading-passage-dialog"
          aria-label={`${title} 지문`}
          onClose={() => openerRef.current?.focus()}
        >
          <div className="dialog-heading">
            <h2 lang="es">{title}</h2>
            <button className="button secondary small" type="button" onClick={close}>지문 닫기</button>
          </div>
          <div className="reading-dialog-passage" lang="es">{passageContent ?? passage}</div>
        </dialog>
      )}
    </section>
  );
}
