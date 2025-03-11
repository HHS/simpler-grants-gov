import clsx from "clsx";
import { UswdsIconNames } from "src/types/generalTypes";

import SpriteSVG from "public/img/uswds-sprite.svg";

interface IconProps {
  name: UswdsIconNames;
  className?: string;
  height?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const sprite_uri = SpriteSVG.src as string;

export function USWDSIcon(props: IconProps) {
  return (
    <svg
      className={clsx("usa-icon", props.className)}
      aria-hidden="true"
      height={props.height}
      role="img"
    >
      <use href={`${sprite_uri}#${props.name}`}></use>
    </svg>
  );
}
