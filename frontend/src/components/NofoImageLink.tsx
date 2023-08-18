import { pdf } from "src/constants/nofoPdfs";

import Image from "next/image";
import Link from "next/link";
import { Grid } from "@trussworks/react-uswds";

const NofoImageLink = ({ file, image, alt }: pdf) => {
  return (
    <Grid className="margin-bottom-2" tablet={{ col: 6 }} tabletLg={{ col: 3 }}>
      <Link className="padding-0" href={file} target="_blank">
        <Image
          alt={alt}
          className="pdf-card"
          src={image}
          height={1290}
          width={980}
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
