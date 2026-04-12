import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
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
            "radial-gradient(circle at top left, rgba(255,143,60,0.45), transparent 32%), linear-gradient(135deg, #101317 0%, #171c22 45%, #1a261c 100%)"
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 220,
            fontWeight: 900,
            background: "linear-gradient(135deg, #ff8f3c, #f06700)",
            boxShadow: "0 30px 80px rgba(240,103,0,0.35)"
          }}
        >
          Q
        </div>
      </div>
    ),
    size
  );
}
