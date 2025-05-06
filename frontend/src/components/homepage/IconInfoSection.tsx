import { JSX } from "react";

import Link from "next/link";
import { USWDSIcon } from "src/components/USWDSIcon";
import { UswdsIconNames } from "src/types/generalTypes";

type Props = {
  description: string;
  iconName: UswdsIconNames;
  link: string;
  linkText: string;
  title: string;
};

export default function IconInfo({
  description,
  iconName,
  link,
  linkText,
  title,
}: Props): JSX.Element {
  return (
    <>
      <USWDSIcon
        name={iconName}
        className="usa-icon--size-4 text-middle"
        aria-label={`${iconName}-icon`}
      />
      <h3>{title}</h3>
      <p className="font-sans-md line-height-sans-4">{description}</p>
      <Link
        href={link}
        className="font-sans-md line-height-sans-4"
      >
        {linkText}
      </Link>
    </>
  );
}
