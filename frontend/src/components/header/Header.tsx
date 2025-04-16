"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import GrantsLogo from "public/img/grants-logo.svg";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import {
  GovBanner,
  Header as USWDSHeader,
  NavMenuButton,
  Title,
} from "@trussworks/react-uswds";

import { UserControl } from "../user/UserControl";
import NavLinkList from "./NavLinkList";

type Props = {
  locale?: string;
};

const Header = ({ locale }: Props) => {
  const t = useTranslations("Header");
  const [isMobileNavExpanded, setIsMobileNavExpanded] =
    useState<boolean>(false);

  const closeMenuOnEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsMobileNavExpanded(false);
    }
  }, []);

  useEffect(() => {
    if (isMobileNavExpanded) {
      document.addEventListener("keyup", closeMenuOnEscape);
    }
    return () => {
      document.removeEventListener("keyup", closeMenuOnEscape);
    };
  }, [isMobileNavExpanded, closeMenuOnEscape]);

  const { checkFeatureFlag } = useFeatureFlags();
  const showLoginLink = checkFeatureFlag("authOn");
  const language = locale && locale.match("/^es/") ? "spanish" : "english";

  const handleMobileNavToggle = () => {
    setIsMobileNavExpanded(!isMobileNavExpanded);
  };

  return (
    <>
      <div
        className={clsx({
          "usa-overlay": true,
          "desktop:display-none": true,
          "is-visible": isMobileNavExpanded,
        })}
        onClick={() => {
          if (isMobileNavExpanded) {
            setIsMobileNavExpanded(false);
          }
        }}
      />
      <GovBanner language={language} />
      <USWDSHeader
        basic={true}
        className="desktop:position-sticky top-0 desktop:z-500 bg-white border-bottom-2px border-primary-vivid"
      >
        <div className="usa-nav-container display-flex flex-justify">
          <div className="usa-navbar border-bottom-0">
            <Title className="margin-y-2">
              <div className="display-flex flex-align-center">
                <Link href="/" className="position-relative">
                  <Image
                    alt={t("title")}
                    src={GrantsLogo as string}
                    className="height-4 display-block position-relative desktop:height-auto"
                    unoptimized
                    priority
                    fill
                  />
                </Link>
              </div>
            </Title>
          </div>
          <div className="usa-navbar order-last desktop:display-none">
            <NavMenuButton
              onClick={handleMobileNavToggle}
              label={t("navLinks.menuToggle")}
              className="usa-menu-btn"
            />
          </div>
          {!!showLoginLink && (
            <div className="usa-nav__primary margin-top-0 padding-bottom-05 text-no-wrap desktop:order-last margin-left-auto desktop:height-auto height-6">
              <UserControl />
            </div>
          )}
          <NavLinkList
            mobileExpanded={isMobileNavExpanded}
            onToggleMobileNav={handleMobileNavToggle}
          />
        </div>
      </USWDSHeader>
    </>
  );
};

export default Header;
