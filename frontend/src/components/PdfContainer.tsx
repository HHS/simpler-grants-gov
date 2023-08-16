import { pdf } from "src/constants/nofoPdfs";

import Link from "next/link";
import { Grid } from "@trussworks/react-uswds";

const PdfCard = ({ file, image, alt }: pdf) => {
  return (
    <Grid className="margin-bottom-2" tablet={{ col: 6 }} tabletLg={{ col: 3 }}>
      <Link className="padding-0" href={file} target="_blank">
        <img alt={alt} className="pdf-card" src={image} />
      </Link>
    </Grid>
  );
};

export default PdfCard;
