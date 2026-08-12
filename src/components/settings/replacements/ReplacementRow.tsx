import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, GripVertical } from "lucide-react";
import type { Replacement } from "@/bindings";
import { ReplacementRowActions } from "./ReplacementRowActions";
import { ReplacementRuleIndicators } from "./ReplacementRuleIndicators";

interface ReplacementRowProps {
  replacement: Replacement;
  disabled: boolean;
  isEditing: boolean;
  isDuplicate: boolean;
  isRecentlyImported: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  reorderingDisabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: React.DragEventHandler<HTMLSpanElement>;
  onDragEnter: React.DragEventHandler<HTMLDivElement>;
  onDragEnd: React.DragEventHandler<HTMLSpanElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
}

export const ReplacementRow: React.FC<ReplacementRowProps> = ({
  replacement,
  disabled,
  isEditing,
  isDuplicate,
  isRecentlyImported,
  isDragging,
  isDropTarget,
  reorderingDisabled,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}) => {
  const { t } = useTranslation();
  const replacementIsEnabled = replacement.enabled ?? true;
  const replacementUsesMagic =
    /\[(?:date|time|lowercase|lowcase|uppercase|capitalize|nospace)\]|\[run\]["']/.test(
      replacement.replace,
    );
  return (
    <div
      role="listitem"
      className={`group mx-4 mb-2 flex items-start gap-2 rounded-lg border bg-background px-2 py-2 transition-all ${
        replacementIsEnabled
          ? "border-mid-gray/20"
          : "border-red-500/30 bg-red-500/5 opacity-70"
      } ${isDuplicate ? "border-yellow-500/50 bg-yellow-500/5" : ""} ${
        isRecentlyImported ? "border-green-500/40 bg-green-500/5" : ""
      } ${isDragging ? "scale-[0.99] border-dashed opacity-40" : ""} ${
        isDropTarget ? "border-logo-primary bg-logo-primary/10" : ""
      } ${isEditing ? "border-logo-primary/50 bg-logo-primary/5" : ""}`}
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <span
        draggable={!reorderingDisabled}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`mt-1 rounded p-0.5 text-mid-gray transition-colors ${
          reorderingDisabled
            ? "cursor-not-allowed opacity-30"
            : "cursor-grab hover:bg-mid-gray/10 hover:text-white active:cursor-grabbing"
        }`}
        aria-hidden="true"
      >
        <GripVertical className="h-4 w-4 shrink-0" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <code
            className="min-w-0 flex-1 truncate whitespace-pre rounded border border-mid-gray/20 bg-mid-gray/10 px-2 py-1 text-xs text-white"
            title={replacement.search}
          >
            {replacement.search}
          </code>
          <ArrowRight
            className="h-3.5 w-3.5 shrink-0 text-mid-gray"
            aria-hidden="true"
          />
          <code
            className={`min-w-0 flex-1 truncate whitespace-pre rounded border px-2 py-1 text-xs ${
              replacementUsesMagic
                ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                : "border-logo-primary/20 bg-logo-primary/10 text-logo-primary"
            }`}
            title={replacement.replace}
          >
            {replacement.replace.length > 0 ? (
              replacement.replace
            ) : (
              <span className="italic text-mid-gray">
                {t("settings.replacements.rule.emptyReplacement")}
              </span>
            )}
          </code>
        </div>
        <div className="mt-1.5 flex min-h-6 items-center justify-between gap-2">
          <ReplacementRuleIndicators
            replacement={replacement}
            replacementUsesMagic={replacementUsesMagic}
            isDuplicate={isDuplicate}
            isRecentlyImported={isRecentlyImported}
          />
          <ReplacementRowActions
            replacement={replacement}
            disabled={disabled}
            reorderingDisabled={reorderingDisabled}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
            onDuplicate={onDuplicate}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        </div>
      </div>
    </div>
  );
};
