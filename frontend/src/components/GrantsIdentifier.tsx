import { useTranslation } from "next-i18next";
import {
  Identifier,
  IdentifierGov,
  IdentifierIdentity,
  IdentifierLinks,
  IdentifierLogo,
  IdentifierLogos,
  IdentifierMasthead,
  Link,
} from "@trussworks/react-uswds";

const GrantsIdentifier = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Identifier",
  });

  return (
    <Identifier>
      <IdentifierMasthead aria-label="Agency identifier">
        <IdentifierLogos>
          <IdentifierLogo href="#">{}</IdentifierLogo>
        </IdentifierLogos>
        <IdentifierIdentity domain="domain.edu.mil.gov">
          {`An official website of the `}
          <Link href="#">Test Agency Name</Link>
        </IdentifierIdentity>
      </IdentifierMasthead>
      <IdentifierLinks navProps={{ "aria-label": "Important links" }}>
        {}
      </IdentifierLinks>
      <IdentifierGov aria-label="U.S. government information and services">
        {}
      </IdentifierGov>
    </Identifier>
  );
};

export default GrantsIdentifier;
