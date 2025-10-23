"use client"

export default function DebugEnvPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "NOT SET"

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>🔍 Environment Variables Debug</h1>
      <div style={{
        background: "#1a1a1a",
        color: "#00ff00",
        padding: "1rem",
        borderRadius: "8px",
        marginTop: "1rem"
      }}>
        <p><strong>NEXT_PUBLIC_API_URL:</strong></p>
        <p style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>{apiUrl}</p>

        <hr style={{ margin: "1rem 0", borderColor: "#333" }} />

        <p><strong>Expected value:</strong></p>
        <p style={{ color: "#00d9ff" }}>https://gimme-idea.onrender.com/api</p>

        <hr style={{ margin: "1rem 0", borderColor: "#333" }} />

        <p><strong>Status:</strong></p>
        {apiUrl === "https://gimme-idea.onrender.com/api" ? (
          <p style={{ color: "#00ff00", fontSize: "1.5rem" }}>✅ CORRECT</p>
        ) : apiUrl.includes("localhost") ? (
          <p style={{ color: "#ff0000", fontSize: "1.5rem" }}>❌ WRONG - Using localhost!</p>
        ) : (
          <p style={{ color: "#ffaa00", fontSize: "1.5rem" }}>⚠️ NOT SET or WRONG</p>
        )}
      </div>

      <div style={{ marginTop: "2rem", background: "#fff3cd", color: "#856404", padding: "1rem", borderRadius: "8px" }}>
        <p><strong>If WRONG:</strong></p>
        <ol>
          <li>Go to Vercel Dashboard</li>
          <li>Settings → Environment Variables</li>
          <li>Add: NEXT_PUBLIC_API_URL = https://gimme-idea.onrender.com/api</li>
          <li>Redeploy</li>
        </ol>
      </div>
    </div>
  )
}
