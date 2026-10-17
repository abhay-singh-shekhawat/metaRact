import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { enabledServices } from "@/config/services";

/**
 * The share card.
 *
 * Everything on it is read from config — the studio name, the tagline, the
 * service list, the domain — so the card cannot drift from the site's own copy,
 * and it picks up the real name the moment NEXT_PUBLIC_STUDIO_NAME is set.
 * Nothing here states a fact the site does not already state.
 *
 * siteConfig is static, so this is generated once at build time: no request-time
 * cost, and no font fetched over the network at runtime (which the CSP forbids
 * anyway). Typography uses the renderer's bundled default face — the display
 * face is served by next/font and is not reachable from here.
 */

export const alt = `${siteConfig.studioName} — websites, software, design and applied AI`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0b0f17";
const INK_3 = "#6b7488";
const LINE = "#dde2eb";
const PAPER = "#f0f2f6";
const SURFACE = "#ffffff";
const ACCENT = "#2a3cf0";

/** The site's own descriptor, as used in the layout's meta description. */
const EYEBROW = "A small digital-services studio";

export default function OpengraphImage() {
  const domain = siteConfig.siteUrl.replace(/^https?:\/\//, "");
  // Only what the studio actually offers: the same list the enquiry form does.
  const offered = enabledServices();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          padding: 64,
        }}
      >
        {/* Left: the studio itself. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 648,
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                backgroundColor: ACCENT,
                marginRight: 14,
              }}
            />
            <div
              style={{
                fontSize: 22,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: INK_3,
              }}
            >
              {EYEBROW}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 38,
              fontSize: 74,
              lineHeight: 1.06,
              fontWeight: 700,
              letterSpacing: -1.5,
              color: INK,
            }}
          >
            {siteConfig.studioName}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 24,
              width: 620,
              fontSize: 27,
              lineHeight: 1.4,
              color: "#434c60",
            }}
          >
            {siteConfig.tagline}
          </div>

          <div style={{ display: "flex", flexGrow: 1 }} />

          <div style={{ display: "flex", height: 1, backgroundColor: LINE }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 22,
              fontSize: 20,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: INK_3,
            }}
          >
            <div style={{ display: "flex" }}>Every brief reviewed by hand</div>
            {/* A domain is lower-case in the world; keep it that way here. */}
            <div style={{ display: "flex", textTransform: "none", letterSpacing: 0 }}>
              {domain}
            </div>
          </div>
        </div>

        {/* Right: the services ledger, numbered as the site numbers its steps. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 388,
            height: "100%",
            backgroundColor: SURFACE,
            border: `1px solid ${LINE}`,
            borderRadius: 16,
            padding: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: INK_3,
              marginBottom: 8,
            }}
          >
            What we build
          </div>

          {offered.map((service, index) => (
            <div
              key={service.slug}
              style={{
                display: "flex",
                alignItems: "center",
                borderTop: index === 0 ? "none" : `1px solid ${LINE}`,
                padding: "17px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 46,
                  fontSize: 19,
                  color: ACCENT,
                  letterSpacing: 1,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div style={{ display: "flex", fontSize: 23, lineHeight: 1.25, color: INK }}>
                {service.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
