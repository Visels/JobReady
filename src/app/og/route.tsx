import { ImageResponse } from "next/og";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

function paramOrDefault(value: string | null, fallback: string) {
  return value?.trim() || fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = paramOrDefault(
    searchParams.get("title"),
    "Find the role. Prepare for it. Show up ready.",
  );
  const subtitle = paramOrDefault(
    searchParams.get("sub"),
    "Realistic interview preparation for candidates applying to African companies, Kenyan employers, and regional roles.",
  );
  const badge = searchParams.get("badge")?.trim();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#063c31",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 14,
            width: "100%",
            background: "#d7a84f",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -90,
            top: 70,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "rgba(215,168,79,0.14)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 74,
            bottom: 122,
            width: 210,
            height: 210,
            borderRadius: 999,
            border: "1px solid rgba(215,168,79,0.24)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            padding: "58px 72px 54px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              <span>jiandae</span>
            </div>
            {badge ? (
              <div
                style={{
                  display: "flex",
                  border: "1px solid rgba(215,168,79,0.55)",
                  borderRadius: 999,
                  padding: "12px 18px",
                  color: "#f4d28f",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {badge}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1
              style={{
                margin: 0,
                maxWidth: 920,
                fontSize: 76,
                lineHeight: 0.98,
                letterSpacing: -3.2,
                fontWeight: 850,
                color: "#ffffff",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                margin: "28px 0 0",
                maxWidth: 790,
                fontSize: 30,
                lineHeight: 1.28,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 28,
              width: "100%",
            }}
          >
            {[
              ["Roles", "prepare around real opportunities"],
              ["Practice", "company and role interview drills"],
              ["Feedback", "clearer answers for hiring panels"],
            ].map(([value, label]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  borderTop: "1px solid rgba(215,168,79,0.42)",
                  paddingTop: 18,
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 850,
                    color: "#f4d28f",
                  }}
                >
                  {value}
                </span>
                <span
                  style={{
                    marginTop: 8,
                    fontSize: 18,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
