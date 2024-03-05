import React from "react";

// Defines a loading component for the search feature
export default function Loading() {
  const skeletonStyle = {
    backgroundColor: "#eee",
    borderRadius: "4px",
    height: "20px",
    margin: "10px 0",
    width: "50%",
  };

  return (
    <ul>
      {Array.from({ length: 25 }).map((_, index) => (
        <li key={index} style={skeletonStyle} />
      ))}
    </ul>
  );
}
