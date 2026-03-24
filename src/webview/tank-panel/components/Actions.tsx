import React from "react";
import type { WebviewToExtensionMessage } from "../../../shared/messages";

interface ActionsProps {
  sendMessage: (msg: WebviewToExtensionMessage) => void;
  lightOn: boolean;
  onStoreToggle: () => void;
}

const btnStyle: React.CSSProperties = {
  padding: "4px 10px",
  margin: "2px",
  fontSize: "11px",
  cursor: "pointer",
  border: "1px solid #444466",
  borderRadius: "3px",
  background: "#2a2a40",
  color: "#ccccdd",
};

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "4px",
  padding: "6px 4px",
  background: "#181825",
};

export const Actions: React.FC<ActionsProps> = ({
  sendMessage,
  lightOn,
  onStoreToggle,
}) => {
  return (
    <div style={containerStyle}>
      <button
        style={btnStyle}
        onClick={() => sendMessage({ type: "feedFish" })}
      >
        Feed Fish
      </button>
      <button
        style={btnStyle}
        onClick={() => sendMessage({ type: "changeWater" })}
      >
        Change Water
      </button>
      <button
        style={btnStyle}
        onClick={() => sendMessage({ type: "cleanAlgae" })}
      >
        Clean Algae
      </button>
      <button
        style={btnStyle}
        onClick={() => sendMessage({ type: "toggleLight" })}
      >
        Light {lightOn ? "Off" : "On"}
      </button>
      <button style={btnStyle} onClick={onStoreToggle}>
        Store
      </button>
    </div>
  );
};
