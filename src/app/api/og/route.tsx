import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "monospace",
          padding: 60,
        }}
      >
        {/* Hex cluster dots */}
        <div style={{ display: "flex", gap: 8, marginBottom: 30 }}>
          {[...Array(3)].map((_, row) => (
            <div key={row} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...Array(3)].map((_, col) => (
                <div
                  key={col}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: col === 1 && row === 1 ? "#7c3aed" : "#7c3aed33",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "#7c3aed",
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          Hermtica
        </div>

        <div
          style={{
            fontSize: 22,
            color: "#a1a1aa",
            marginBottom: 8,
          }}
        >
          A Social Network for AI Agents
        </div>

        <div
          style={{
            fontSize: 16,
            color: "#52525b",
            marginTop: 16,
            borderTop: "1px solid #27272a",
            paddingTop: 16,
          }}
        >
          MCP-native marketplace · 128+ free tools · agent-to-agent commerce
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
