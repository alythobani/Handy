import React from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Copy,
  GripVertical,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import type { Replacement } from "@/bindings";
import { Button } from "../../ui/Button";

interface ReplacementRowProps {
  replacement: Replacement;
  disabled: boolean;
  isDuplicate: boolean;
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
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDragEnter: React.DragEventHandler<HTMLDivElement>;
  onDragEnd: React.DragEventHandler<HTMLDivElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
}

export const ReplacementRow: React.FC<ReplacementRowProps> = ({
  replacement,
  disabled,
  isDuplicate,
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
  const replacementTrimsContext =
    replacement.trim_punctuation_before ||
    replacement.trim_punctuation_after ||
    replacement.trim_spaces_before ||
    replacement.trim_spaces_after;
  const capitalizationIsConfigured =
    replacement.capitalization_rule !== undefined &&
    replacement.capitalization_rule !== "none";
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 transition-all ${
        replacementIsEnabled ? "" : "bg-red-500/5 opacity-60"
      } ${isDuplicate ? "ring-1 ring-inset ring-yellow-500/40" : ""} ${
        isDragging ? "scale-[0.99] opacity-40" : ""
      } ${isDropTarget ? "bg-logo-primary/10" : ""}`}
      draggable={!reorderingDisabled}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <GripVertical
        className={`h-4 w-4 shrink-0 text-mid-gray ${
          reorderingDisabled ? "cursor-not-allowed opacity-30" : "cursor-grab"
        }`}
        aria-hidden="true"
      />
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
        {replacement.is_regex && (
          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-400">
            {t("settings.replacements.rule.regexBadge")}
          </span>
        )}
        {replacementUsesMagic && (
          <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-purple-400">
            {t("settings.replacements.rule.magicBadge")}
          </span>
        )}
        {replacementTrimsContext && (
          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-400">
            {t("settings.replacements.rule.trimmingBadge")}
          </span>
        )}
        {capitalizationIsConfigured && (
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
            {t("settings.replacements.rule.capitalizationBadge")}
          </span>
        )}
        {!replacementIsEnabled && (
          <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-400">
            {t("settings.replacements.rule.disabledBadge")}
          </span>
        )}
        {isDuplicate && (
          <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-yellow-400">
            {t("settings.replacements.rule.duplicateBadge")}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMoveUp}
          disabled={disabled || reorderingDisabled || !canMoveUp}
          aria-label={t("settings.replacements.rule.moveUp", {
            search: replacement.search,
          })}
          title={t("settings.replacements.rule.moveUp", {
            search: replacement.search,
          })}
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMoveDown}
          disabled={disabled || reorderingDisabled || !canMoveDown}
          aria-label={t("settings.replacements.rule.moveDown", {
            search: replacement.search,
          })}
          title={t("settings.replacements.rule.moveDown", {
            search: replacement.search,
          })}
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          disabled={disabled}
          aria-label={t(
            replacementIsEnabled
              ? "settings.replacements.rule.disable"
              : "settings.replacements.rule.enable",
            { search: replacement.search },
          )}
          title={t(
            replacementIsEnabled
              ? "settings.replacements.rule.disable"
              : "settings.replacements.rule.enable",
            { search: replacement.search },
          )}
        >
          {replacementIsEnabled ? (
            <PowerOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Power className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
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
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          disabled={disabled}
          aria-label={t("settings.replacements.rule.duplicate", {
            search: replacement.search,
          })}
          title={t("settings.replacements.rule.duplicate", {
            search: replacement.search,
          })}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
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
