import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function AdminIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top right, rgba(20,184,166,0.45), transparent 34%), linear-gradient(135deg, #08111f 0%, #0f172a 52%, #052e2b 100%)"
        }}
      >
        <div
          style={{
            width: 326,
            height: 326,
            borderRadius: 92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: -8,
            background: "linear-gradient(135deg, #14b8a6, #0f766e)",
            boxShadow: "0 30px 80px rgba(20,184,166,0.32)"
          }}
        >
          QA
        </div>
      </div>
    ),
    size
  );
}
