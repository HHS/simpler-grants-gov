import { pdf } from "src/constants/nofoPdfs";

import Image from "next/image";
import Link from "next/link";
import { Grid } from "@trussworks/react-uswds";

const gridCLassName = (portrait: boolean) => {
  return `margin-bottom-4 tablet-lg:flex-${portrait ? "3" : "4"} tablet:order-${
    portrait ? "first" : "last"
  } tablet-lg:order-initial`;
};

const NofoImageLink = ({ file, image, alt, width, height }: pdf) => {
  const portrait = height > width;

  return (
    <Grid
      className={gridCLassName(portrait)}
      tablet={{ col: 6 }}
      tabletLg={{ col: 3 }}
    >
      <Link className="padding-0" href={file} target="_blank">
        <Image
          alt={alt}
          className="pdf-card"
          src={image}
          height={height}
          width={width}
          style={{
            width: "100%",
            height: "auto",
          }}
          sizes="(max-width: 640px) 100vw, (max-width: 880px) 50vw, 25vw"
        />
      </Link>
    </Grid>
  );
};

export default NofoImageLink;
