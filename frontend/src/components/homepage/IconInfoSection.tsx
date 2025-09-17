import { UswdsIconNames } from "src/types/generalTypes";

import Link from "next/link";
import { JSX } from "react";

import { USWDSIcon } from "src/components/USWDSIcon";

type Props = {
  description: string;
  iconName: UswdsIconNames;
  link?: string;
  linkText?: string;
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
      <h3 className="margin-top-2">{title}</h3>
      <p>{description}</p>
      {link && (
        <p>
          <Link href={link}>{linkText}</Link>
        </p>
      )}
    </>
  );
}
