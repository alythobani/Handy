import React from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import type { Replacement } from "@/bindings";
import { Button } from "../../ui/Button";

interface ReplacementRowActionsProps {
  replacement: Replacement;
  disabled: boolean;
  reorderingDisabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

interface IconActionButtonProps {
  label: string;
  disabled: boolean;
  variant?: "ghost" | "danger-ghost";
  children: React.ReactNode;
  onClick: () => void;
}

const IconActionButton: React.FC<IconActionButtonProps> = ({
  label,
  disabled,
  variant = "ghost",
  children,
  onClick,
}) => (
  <Button
    type="button"
    variant={variant}
    size="sm"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className="p-1 text-mid-gray"
  >
    {children}
  </Button>
);

export const ReplacementRowActions: React.FC<ReplacementRowActionsProps> = ({
  replacement,
  disabled,
  reorderingDisabled,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) => {
  const { t } = useTranslation();
  const replacementIsEnabled = replacement.enabled ?? true;
  const translatedAction = (action: string) =>
    t(`settings.replacements.rule.${action}`, { search: replacement.search });
  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
      <IconActionButton
        label={translatedAction("moveUp")}
        disabled={disabled || reorderingDisabled || !canMoveUp}
        onClick={onMoveUp}
      >
        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label={translatedAction("moveDown")}
        disabled={disabled || reorderingDisabled || !canMoveDown}
        onClick={onMoveDown}
      >
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label={translatedAction(replacementIsEnabled ? "disable" : "enable")}
        disabled={disabled}
        onClick={onToggle}
      >
        {replacementIsEnabled ? (
          <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Power className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </IconActionButton>
      <IconActionButton
        label={translatedAction("edit")}
        disabled={disabled}
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label={translatedAction("duplicate")}
        disabled={disabled}
        onClick={onDuplicate}
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      </IconActionButton>
      <IconActionButton
        label={translatedAction("delete")}
        disabled={disabled}
        variant="danger-ghost"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </IconActionButton>
    </div>
  );
};
