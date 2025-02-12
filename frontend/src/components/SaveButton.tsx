import { ReactNode } from "react";

import SimplerAlert from "./SimplerAlert";
import SimplerButton from "./SimplerButton";

interface SaveButtonProps {
  buttonClick?: () => Promise<void>;
  messageClick: () => void;
  buttonId: string;
  defaultText: string;
  error: boolean;
  loading: boolean;
  loadingText: string;
  message: boolean;
  messageText: string | ReactNode;
  saved: boolean;
  savedText: string;
}

const SaveButton = ({
  buttonClick,
  messageClick,
  buttonId,
  defaultText,
  error,
  loading = false,
  loadingText,
  message,
  messageText,
  saved = false,
  savedText,
}: SaveButtonProps) => {
  const text = saved ? savedText : defaultText;
  const type = error ? "error" : "success";
  return (
    <div className="display-flex flex-align-start">
      <SimplerButton
        icon={saved ? "star" : "star_outline"}
        loadingText={loadingText}
        data-testid="simpler-save-button"
        loading={loading}
        onClick={buttonClick}
        type="button"
        disabled={loading}
        id={buttonId}
      >
        {text}
      </SimplerButton>
      {message && (
        <SimplerAlert
          type={type}
          buttonId={buttonId}
          messageText={messageText}
          alertClick={messageClick}
        />
      )}
    </div>
  );
};

export default SaveButton;
