"use client";

import { useTranslations } from "next-intl";

export function ModalFooterProductSupport() {
  const t = useTranslations("Application.transferOwnershipModal");

  const productSupportText = t.rich("footer.productSupport", {
    link: (content) => <a href="mailto:simpler@grants.gov">{content}</a>,
    tel: (content) => {
      const phoneNumber = String(content);
      return <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>;
    },
  });

  const alternativeMethodsOfApplyingText = t.rich(
    "footer.alternativeMethodsOfApplying",
    {
      link: (content) => {
        const url = String(content);
        return <a href={`https://${url}`}>{url}</a>;
      },
    },
  );

  return (
    <div className="margin-top-4">
      <p>
        {productSupportText}
        <br />
        {alternativeMethodsOfApplyingText}
      </p>
    </div>
  );
}
