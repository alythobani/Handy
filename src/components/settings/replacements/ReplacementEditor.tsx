import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { commands, type Replacement } from "@/bindings";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { AdvancedReplacementOptions } from "./AdvancedReplacementOptions";
import { MagicTagInput } from "./MagicTagInput";
import {
  completeReplacement,
  type CompleteReplacement,
} from "./replacementDefaults";

interface ReplacementEditorProps {
  initialReplacement: Replacement;
  isEditing: boolean;
  disabled: boolean;
  onSave: (replacement: CompleteReplacement) => void;
  onCancel: () => void;
}

export const ReplacementEditor: React.FC<ReplacementEditorProps> = ({
  initialReplacement,
  isEditing,
  disabled,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [replacement, setReplacement] = useState(() =>
    completeReplacement(initialReplacement),
  );
  const [regexError, setRegexError] = useState<string | null>(null);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (replacement.search.length === 0 || disabled) {
      return;
    }
    if (replacement.is_regex) {
      const validationResult = await commands.validateReplacementRegex(
        replacement.search,
      );
      if (validationResult.status === "error") {
        setRegexError(validationResult.error);
        return;
      }
    }
    onSave(replacement);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };
  return (
    <form
      className="space-y-3 px-4 py-3 bg-logo-primary/5"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <h3 className="text-sm font-medium">
        {t(
          isEditing
            ? "settings.replacements.editor.editTitle"
            : "settings.replacements.editor.addTitle",
        )}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-mid-gray">
            {t("settings.replacements.editor.searchLabel")}
          </span>
          <Input
            className="w-full"
            value={replacement.search}
            onChange={(event) => {
              setReplacement({ ...replacement, search: event.target.value });
              setRegexError(null);
            }}
            placeholder={t("settings.replacements.editor.searchPlaceholder")}
            disabled={disabled}
            autoFocus
            aria-invalid={regexError !== null}
            aria-describedby={
              regexError ? "replacement-regex-error" : undefined
            }
          />
          {regexError && (
            <span
              id="replacement-regex-error"
              role="alert"
              className="block text-xs text-red-400"
            >
              {t("settings.replacements.editor.regexError", {
                error: regexError,
              })}
            </span>
          )}
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-mid-gray">
            {t("settings.replacements.editor.replaceLabel")}
          </span>
          <MagicTagInput
            value={replacement.replace}
            onChange={(replace) => setReplacement({ ...replacement, replace })}
            placeholder={t("settings.replacements.editor.replacePlaceholder")}
            disabled={disabled}
          />
        </label>
      </div>
      <p className="text-xs text-mid-gray">
        {t("settings.replacements.editor.emptyReplacementHint")}
      </p>
      <AdvancedReplacementOptions
        replacement={replacement}
        disabled={disabled}
        onChange={(updatedReplacement) => {
          setReplacement(updatedReplacement);
          setRegexError(null);
        }}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
          className="inline-flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          {t("settings.replacements.editor.cancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={replacement.search.length === 0 || disabled}
          className="inline-flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          {t(
            isEditing
              ? "settings.replacements.editor.update"
              : "settings.replacements.editor.add",
          )}
        </Button>
      </div>
    </form>
  );
};
