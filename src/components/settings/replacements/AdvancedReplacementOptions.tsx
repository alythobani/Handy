import React from "react";
import { useTranslation } from "react-i18next";
import type { CapitalizationRule } from "@/bindings";
import type { CompleteReplacement } from "./replacementDefaults";

interface AdvancedReplacementOptionsProps {
  replacement: CompleteReplacement;
  disabled: boolean;
  onChange: (replacement: CompleteReplacement) => void;
}

interface AdvancedOptionCheckboxProps {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

const AdvancedOptionCheckbox: React.FC<AdvancedOptionCheckboxProps> = ({
  checked,
  disabled,
  label,
  onChange,
}) => (
  <label className="flex items-center gap-2 text-xs">
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 accent-logo-primary"
    />
    <span>{label}</span>
  </label>
);

export const AdvancedReplacementOptions: React.FC<
  AdvancedReplacementOptionsProps
> = ({ replacement, disabled, onChange }) => {
  const { t } = useTranslation();
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
  }> = [
    {
      value: "none",
      label: t("settings.replacements.editor.capitalization.none"),
    },
    {
      value: "force_uppercase",
      label: t("settings.replacements.editor.capitalization.uppercase"),
    },
    {
      value: "force_lowercase",
      label: t("settings.replacements.editor.capitalization.lowercase"),
    },
  ];
  return (
    <fieldset className="space-y-3 rounded-md border border-mid-gray/20 p-3">
      <legend className="px-1 text-xs font-medium text-mid-gray">
        {t("settings.replacements.editor.advancedTitle")}
      </legend>
      <AdvancedOptionCheckbox
        checked={replacement.is_regex}
        disabled={disabled}
        label={t("settings.replacements.editor.regexLabel")}
        onChange={(checked) => updateBooleanOption("is_regex", checked)}
      />
      <div className="grid grid-cols-2 gap-2">
        <AdvancedOptionCheckbox
          checked={replacement.trim_punctuation_before}
          disabled={disabled}
          label={t("settings.replacements.editor.trimPunctuationBefore")}
          onChange={(checked) =>
            updateBooleanOption("trim_punctuation_before", checked)
          }
        />
        <AdvancedOptionCheckbox
          checked={replacement.trim_punctuation_after}
          disabled={disabled}
          label={t("settings.replacements.editor.trimPunctuationAfter")}
          onChange={(checked) =>
            updateBooleanOption("trim_punctuation_after", checked)
          }
        />
        <AdvancedOptionCheckbox
          checked={replacement.trim_spaces_before}
          disabled={disabled}
          label={t("settings.replacements.editor.trimSpacesBefore")}
          onChange={(checked) =>
            updateBooleanOption("trim_spaces_before", checked)
          }
        />
        <AdvancedOptionCheckbox
          checked={replacement.trim_spaces_after}
          disabled={disabled}
          label={t("settings.replacements.editor.trimSpacesAfter")}
          onChange={(checked) =>
            updateBooleanOption("trim_spaces_after", checked)
          }
        />
      </div>
      <label className="block space-y-1 text-xs">
        <span className="font-medium text-mid-gray">
          {t("settings.replacements.editor.capitalization.label")}
        </span>
        <select
          value={replacement.capitalization_rule}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...replacement,
              capitalization_rule: event.target.value as CapitalizationRule,
            })
          }
          className="w-full rounded-md border border-mid-gray/80 bg-mid-gray/10 px-2 py-1 text-sm focus:border-logo-primary focus:outline-none"
        >
          {capitalizationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
};
