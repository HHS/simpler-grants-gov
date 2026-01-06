import React from "react";

type NextImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  alt?: string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

export default function Image({
  src,
  alt = "",
  fill: _fill,
  priority: _priority,
  unoptimized: _unoptimized,
  ...rest
}: NextImageProps) {
  const resolvedSrc = typeof src === "string" ? src : src.src;
  return <img src={resolvedSrc} alt={alt} {...rest} />;
}
