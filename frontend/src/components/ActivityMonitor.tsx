import { useUser } from "src/services/auth/useUser";

import { useEffect } from "react";

export function ActivityMonitor() {
  const { user, refreshIfExpiring, refreshIfExpired } = useUser();
  const [listening, setListening] = useState(false);
  useEffect(() => {
    if (!user || !user.token) {
      // remove handlers
      setListening(false);
      return;
    }
    if (!listening) {
      // set up handlers
      setListening(true);
    }
  }, [user, user?.token]);
}
