interface CompanionPanelProps {
  problemId: string;
  problemTitle: string;
  onClose: () => void;
}

export default function CompanionPanel({
  problemId,
  problemTitle,
  onClose,
}: CompanionPanelProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        width: "420px",
        height: "500px",
        zIndex: 999999,
        background: "#1e1e1e",
        color: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #333",
          fontWeight: "600",
        }}
      >
        <span>CSES Companion</span>

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            color: "#aaa",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "20px" }}>
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "20px",
          }}
        >
          {problemTitle}
        </h2>

        <p
          style={{
            margin: "0 0 30px 0",
            color: "#999",
          }}
        >
          Problem #{problemId}
        </p>

        <div
          style={{
            padding: "30px",
            borderRadius: "8px",
            background: "#252526",
            textAlign: "center",
            color: "#888",
          }}
        >
          Editor coming soon...
        </div>
      </div>
    </div>
  );
}
