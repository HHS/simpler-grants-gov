import React from "react";

export default function Loading() {
  const listStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "50vh",
    listStyleType: "none",
  };

  const skeletonStyle = {
    backgroundColor: "#eee",
    borderRadius: "4px",
    height: "20px",
    margin: "10px 0",
    width: "50%",
  };

  return (
    <ul style={listStyle}>
      {Array.from({ length: 10 }).map((_, index) => (
        <li key={index} style={skeletonStyle} />
      ))}
    </ul>
  );
}
