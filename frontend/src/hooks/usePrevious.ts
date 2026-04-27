import { useEffect, useRef } from "react";

export const usePrevious = <T>(value: T) => {
  const ref = useRef<T>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  // TODO #9637
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
};
