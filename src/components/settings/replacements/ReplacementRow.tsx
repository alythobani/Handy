import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import type { Replacement } from "@/bindings";
import { Button } from "../../ui/Button";

interface ReplacementRowProps {
  replacement: Replacement;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const ReplacementRow: React.FC<ReplacementRowProps> = ({
  replacement,
  disabled,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const replacementIsEnabled = replacement.enabled ?? true;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${replacementIsEnabled ? "" : "opacity-50"}`}
    >
      <div className="min-w-0 flex flex-1 items-center gap-3">
        <code className="min-w-0 flex-1 truncate rounded bg-mid-gray/10 px-2 py-1 text-sm">
          {replacement.search}
        </code>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-mid-gray"
          aria-hidden="true"
        />
        <code className="min-w-0 flex-1 truncate rounded bg-mid-gray/10 px-2 py-1 text-sm">
          {replacement.replace.length > 0 ? (
            replacement.replace
          ) : (
            <span className="italic text-mid-gray">
              {t("settings.replacements.rule.emptyReplacement")}
            </span>
          )}
        </code>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={disabled}
          aria-label={t("settings.replacements.rule.edit", {
            search: replacement.search,
          })}
          title={t("settings.replacements.rule.edit", {
            search: replacement.search,
          })}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="danger-ghost"
          size="sm"
          onClick={onDelete}
          disabled={disabled}
          aria-label={t("settings.replacements.rule.delete", {
            search: replacement.search,
          })}
          title={t("settings.replacements.rule.delete", {
            search: replacement.search,
          })}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
