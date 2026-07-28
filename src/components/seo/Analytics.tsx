import Script from "next/script";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-FZ0C6Q39YB";
const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "wpvmnypbla";

export function Analytics() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `}
      </Script>
      <Script id="jobready-event-tracking" strategy="afterInteractive">
        {`
          (function () {
            function track(name, params) {
              if (!name) return;
              if (typeof window.gtag === "function") {
                window.gtag("event", name, params || {});
              }
              if (typeof window.clarity === "function") {
                window.clarity("event", name);
              }
            }

            document.addEventListener("click", function (event) {
              var target = event.target && event.target.closest
                ? event.target.closest("[data-analytics-event]")
                : null;
              if (!target) return;

              track(target.getAttribute("data-analytics-event"), {
                destination: target.getAttribute("href") || target.getAttribute("data-analytics-destination") || undefined,
                product: target.getAttribute("data-analytics-product") || undefined,
                source: target.getAttribute("data-analytics-source") || undefined
              });
            });

            document.addEventListener("submit", function (event) {
              var target = event.target;
              if (!target || !target.getAttribute) return;
              track(target.getAttribute("data-analytics-event"), {
                action: target.getAttribute("action") || undefined,
                product: target.getAttribute("data-analytics-product") || undefined,
                source: target.getAttribute("data-analytics-source") || undefined
              });
            });
          })();
        `}
      </Script>
    </>
  );
}
