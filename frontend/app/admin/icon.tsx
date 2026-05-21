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
            position: "relative",
            width: 336,
            height: 336,
            borderRadius: 104,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            background: "linear-gradient(135deg, #14b8a6, #0f766e)",
            boxShadow: "0 30px 80px rgba(20,184,166,0.32)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 34,
              borderRadius: 80,
              border: "10px solid rgba(255,255,255,0.28)"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 78,
              width: 138,
              height: 92,
              borderRadius: "70px 70px 34px 34px",
              background: "rgba(255,255,255,0.94)"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 116,
              width: 190,
              height: 120,
              borderRadius: 52,
              background: "#f8fafc",
              boxShadow: "0 18px 38px rgba(8,17,31,0.28)"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 151,
              left: 100,
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "#0f766e"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 151,
              right: 100,
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "#0f766e"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 204,
              width: 112,
              height: 14,
              borderRadius: 999,
              background: "#0f766e"
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 66,
              left: 92,
              width: 54,
              height: 54,
              borderRadius: 27,
              background: "#08111f",
              border: "10px solid #f8fafc"
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 66,
              right: 92,
              width: 54,
              height: 54,
              borderRadius: 27,
              background: "#08111f",
              border: "10px solid #f8fafc"
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 54,
              top: 50,
              width: 76,
              height: 76,
              borderRadius: 28,
              background: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 46,
              fontWeight: 900
            }}
          >
            !
          </div>
        </div>
      </div>
    ),
    size
  );
}
