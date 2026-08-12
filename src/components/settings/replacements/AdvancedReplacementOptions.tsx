import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CaseLower,
  CaseUpper,
  ChevronDown,
  ChevronRight,
  Regex,
  Scissors,
  Space,
} from "lucide-react";
import type { CapitalizationRule } from "@/bindings";
import { AdvancedOptionHelp } from "./AdvancedOptionHelp";
import type { CompleteReplacement } from "./replacementDefaults";

interface AdvancedReplacementOptionsProps {
  replacement: CompleteReplacement;
  disabled: boolean;
  onChange: (replacement: CompleteReplacement) => void;
}

interface AdvancedOptionRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  children: React.ReactNode;
}

interface SegmentButtonProps {
  selected: boolean;
  disabled: boolean;
  label: string;
  title?: string;
  children?: React.ReactNode;
  onClick: () => void;
}

const AdvancedOptionRow: React.FC<AdvancedOptionRowProps> = ({
  icon,
  label,
  description,
  children,
}) => (
  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
    <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-mid-gray">
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
      <AdvancedOptionHelp description={description} />
    </div>
    {children}
  </div>
);

const SegmentButton: React.FC<SegmentButtonProps> = ({
  selected,
  disabled,
  label,
  title,
  children = label,
  onClick,
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={selected}
    title={title ?? label}
    disabled={disabled}
    onClick={onClick}
    className={`rounded px-2 py-1 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-logo-primary disabled:cursor-not-allowed disabled:opacity-50 ${
      selected
        ? "bg-mid-gray/30 text-white"
        : "text-mid-gray hover:bg-mid-gray/20 hover:text-white"
    }`}
  >
    {children}
  </button>
);

function replacementHasAdvancedOptions(
  replacement: CompleteReplacement,
): boolean {
  return (
    replacement.is_regex ||
    replacement.trim_punctuation_before ||
    replacement.trim_punctuation_after ||
    replacement.trim_spaces_before ||
    replacement.trim_spaces_after ||
    replacement.capitalization_rule !== "none"
  );
}

export const AdvancedReplacementOptions: React.FC<
  AdvancedReplacementOptionsProps
> = ({ replacement, disabled, onChange }) => {
  const { t } = useTranslation();
  const optionsId = useId();
  const [optionsAreExpanded, setOptionsAreExpanded] = useState(() =>
    replacementHasAdvancedOptions(replacement),
  );
  const updateBooleanOption = (
    option: keyof Pick<
      CompleteReplacement,
      | "is_regex"
      | "trim_punctuation_before"
      | "trim_punctuation_after"
      | "trim_spaces_before"
      | "trim_spaces_after"
    >,
    checked: boolean,
  ) => onChange({ ...replacement, [option]: checked });
  const capitalizationOptions: Array<{
    value: CapitalizationRule;
    label: string;
    icon?: React.ReactNode;
  }> = [
    {
      value: "none",
      label: t("settings.replacements.editor.capitalization.none"),
    },
    {
      value: "force_uppercase",
      label: t("settings.replacements.editor.capitalization.uppercase"),
      icon: <CaseUpper className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
      value: "force_lowercase",
      label: t("settings.replacements.editor.capitalization.lowercase"),
      icon: <CaseLower className="h-3.5 w-3.5" aria-hidden="true" />,
    },
  ];
  return (
    <div>
      <div className="flex justify-center">
        <button
          type="button"
          aria-expanded={optionsAreExpanded}
          aria-controls={optionsId}
          disabled={disabled}
          onClick={() => setOptionsAreExpanded((isExpanded) => !isExpanded)}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-mid-gray transition-colors hover:bg-mid-gray/10 hover:text-white focus:outline-none focus:ring-1 focus:ring-logo-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {optionsAreExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {t("settings.replacements.editor.advancedTitle")}
        </button>
      </div>
      {optionsAreExpanded && (
        <div
          id={optionsId}
          className="mt-2 space-y-2 rounded-lg border border-mid-gray/20 bg-mid-gray/5 p-3"
        >
          <AdvancedOptionRow
            icon={<Regex className="h-4 w-4" />}
            label={t("settings.replacements.rule.regexBadge")}
            description={t("settings.replacements.editor.regexLabel")}
          >
            <input
              type="checkbox"
              checked={replacement.is_regex}
              disabled={disabled}
              onChange={(event) =>
                updateBooleanOption("is_regex", event.target.checked)
              }
              className="h-4 w-4 accent-logo-primary"
              aria-label={t("settings.replacements.editor.regexLabel")}
            />
          </AdvancedOptionRow>
          <AdvancedOptionRow
            icon={<Scissors className="h-4 w-4" />}
            label={t("settings.replacements.editor.trimPunctuationLabel")}
            description={`${t("settings.replacements.editor.trimPunctuationBefore")}. ${t("settings.replacements.editor.trimPunctuationAfter")}.`}
          >
            <div
              role="group"
              aria-label={t(
                "settings.replacements.editor.trimPunctuationLabel",
              )}
              className="flex items-center gap-1 rounded-md bg-mid-gray/10 p-1"
            >
              <SegmentButton
                selected={replacement.trim_punctuation_before}
                disabled={disabled}
                label={t("settings.replacements.editor.trimPunctuationBefore")}
                onClick={() =>
                  updateBooleanOption(
                    "trim_punctuation_before",
                    !replacement.trim_punctuation_before,
                  )
                }
              >
                {t("settings.replacements.editor.before")}
              </SegmentButton>
              <SegmentButton
                selected={replacement.trim_punctuation_after}
                disabled={disabled}
                label={t("settings.replacements.editor.trimPunctuationAfter")}
                onClick={() =>
                  updateBooleanOption(
                    "trim_punctuation_after",
                    !replacement.trim_punctuation_after,
                  )
                }
              >
                {t("settings.replacements.editor.after")}
              </SegmentButton>
            </div>
          </AdvancedOptionRow>
          <AdvancedOptionRow
            icon={<Space className="h-4 w-4" />}
            label={t("settings.replacements.editor.trimSpacesLabel")}
            description={`${t("settings.replacements.editor.trimSpacesBefore")}. ${t("settings.replacements.editor.trimSpacesAfter")}.`}
          >
            <div
              role="group"
              aria-label={t("settings.replacements.editor.trimSpacesLabel")}
              className="flex items-center gap-1 rounded-md bg-mid-gray/10 p-1"
            >
              <SegmentButton
                selected={replacement.trim_spaces_before}
                disabled={disabled}
                label={t("settings.replacements.editor.trimSpacesBefore")}
                onClick={() =>
                  updateBooleanOption(
                    "trim_spaces_before",
                    !replacement.trim_spaces_before,
                  )
                }
              >
                {t("settings.replacements.editor.before")}
              </SegmentButton>
              <SegmentButton
                selected={replacement.trim_spaces_after}
                disabled={disabled}
                label={t("settings.replacements.editor.trimSpacesAfter")}
                onClick={() =>
                  updateBooleanOption(
                    "trim_spaces_after",
                    !replacement.trim_spaces_after,
                  )
                }
              >
                {t("settings.replacements.editor.after")}
              </SegmentButton>
            </div>
          </AdvancedOptionRow>
          <AdvancedOptionRow
            icon={<CaseUpper className="h-4 w-4" />}
            label={t("settings.replacements.editor.capitalization.label")}
            description={`${t("settings.replacements.editor.capitalization.none")}. ${t("settings.replacements.editor.capitalization.uppercase")}. ${t("settings.replacements.editor.capitalization.lowercase")}.`}
          >
            <div
              role="group"
              aria-label={t(
                "settings.replacements.editor.capitalization.label",
              )}
              className="flex items-center gap-1 rounded-md bg-mid-gray/10 p-1"
            >
              {capitalizationOptions.map((option) => (
                <SegmentButton
                  key={option.value}
                  selected={replacement.capitalization_rule === option.value}
                  disabled={disabled}
                  label={option.label}
                  onClick={() =>
                    onChange({
                      ...replacement,
                      capitalization_rule: option.value,
                    })
                  }
                >
                  {option.icon ?? option.label}
                </SegmentButton>
              ))}
            </div>
          </AdvancedOptionRow>
        </div>
      )}
    </div>
  );
};
