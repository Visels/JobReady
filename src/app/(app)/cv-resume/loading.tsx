import "@/components/cv/cv-editor.css";

export default function Loading() {
  return (
    <main className="cv-page cv-route-loading px-3 pb-10 pt-5 md:px-5 lg:px-6" aria-label="Loading CV workspace">
      <div className="cv-skeleton-line cv-skeleton-crumb" />
      <div className="cv-skeleton-line cv-skeleton-title" />
      <div className="cv-skeleton-line cv-skeleton-subtitle" />
      <div className="cv-skeleton-toolbar">
        <div className="cv-skeleton-line cv-skeleton-picker" />
        <div className="cv-skeleton-line cv-skeleton-actions" />
      </div>
      <div className="cv-skeleton-workspace">
        <aside className="cv-skeleton-sections" aria-hidden="true">
          <div className="cv-skeleton-line cv-skeleton-small" />
          {Array.from({ length: 7 }, (_, index) => (
            <div className="cv-skeleton-line cv-skeleton-nav" key={index} />
          ))}
        </aside>
        <section className="cv-skeleton-editor" aria-hidden="true">
          <div className="cv-skeleton-line cv-skeleton-heading" />
          <div className="cv-skeleton-line cv-skeleton-subtitle" />
          {Array.from({ length: 6 }, (_, index) => (
            <div className="cv-skeleton-field" key={index}>
              <div className="cv-skeleton-line cv-skeleton-label" />
              <div className="cv-skeleton-line cv-skeleton-input" />
            </div>
          ))}
        </section>
        <aside className="cv-skeleton-preview" aria-hidden="true">
          <div className="cv-skeleton-line cv-skeleton-small" />
          <div className="cv-skeleton-paper">
            <div className="cv-skeleton-line cv-skeleton-heading" />
            {Array.from({ length: 11 }, (_, index) => (
              <div className="cv-skeleton-line cv-skeleton-text" key={index} />
            ))}
          </div>
        </aside>
      </div>
      <span className="cv-sr-only" role="status">Opening your CV workspace…</span>
    </main>
  );
}
