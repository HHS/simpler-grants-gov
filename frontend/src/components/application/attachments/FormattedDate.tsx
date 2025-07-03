import { formatDateTime } from "src/utils/dateUtil";

import { useEffect, useState } from "react";

export const FormattedDate = ({ date }: { date: string }) => {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(formatDateTime(date));
  }, [date]);

  return <>{formatted}</>;
};
