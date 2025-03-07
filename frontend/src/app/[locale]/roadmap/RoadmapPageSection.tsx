"use client";

import React from "react";

interface RoadmapPageSectionProps {
  sectionTitle?: string;
  sectionContent: React.ReactNode;
}

export default function RoadmapPageSection({
  sectionContent,
  sectionTitle = "",
}: RoadmapPageSectionProps) {
  if (!sectionTitle)
    return (
      <div className="roadmap-page-section grid-container">
        {sectionContent}
      </div>
    );
  return (
    <div className="roadmap-page-section grid-container">
      <div className="roadmap-page-section-item">
        <h2 className="roadmap-section-header">{sectionTitle}</h2>
      </div>
      <div className="roadmap-page-section-item">{sectionContent}</div>
    </div>
  );
}
