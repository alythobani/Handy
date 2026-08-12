import React, { useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Tooltip } from "../../ui/Tooltip";

interface AdvancedOptionHelpProps {
  description: string;
}

export const AdvancedOptionHelp: React.FC<AdvancedOptionHelpProps> = ({
  description,
}) => {
  const [tooltipIsVisible, setTooltipIsVisible] = useState(false);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const handleMouseLeave = () => {
    if (document.activeElement !== triggerRef.current) {
      setTooltipIsVisible(false);
    }
  };
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={description}
        aria-describedby={tooltipIsVisible ? tooltipId : undefined}
        onMouseEnter={() => setTooltipIsVisible(true)}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setTooltipIsVisible(true)}
        onBlur={() => setTooltipIsVisible(false)}
        onClick={() => setTooltipIsVisible(true)}
        className="shrink-0 rounded text-mid-gray transition-colors hover:text-logo-primary focus:outline-none focus:ring-1 focus:ring-logo-primary"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {tooltipIsVisible && (
        <Tooltip targetRef={triggerRef} position="top">
          <p id={tooltipId} role="tooltip" className="text-xs leading-relaxed">
            {description}
          </p>
        </Tooltip>
      )}
    </>
  );
};
