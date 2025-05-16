import { RefObject } from "react";
import {
  Button,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SearchDrawerFilters } from "./SearchDrawerFilters";

export function SearchFilterDrawer({
  drawerId,
  drawerRef,
}: {
  drawerId: string;
  drawerRef: RefObject<ModalRef | null>;
}) {
  return (
    <>
      <ModalHeading id={`${drawerId}-heading`}>titleText</ModalHeading>
      <SearchDrawerFilters />
      <ModalFooter>
        <Button type="button">Submit</Button>
      </ModalFooter>
    </>
  );
}
