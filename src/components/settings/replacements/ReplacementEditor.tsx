import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

interface ReplacementEditorProps {
  initialSearch: string;
  initialReplace: string;
  isEditing: boolean;
  disabled: boolean;
  onSave: (search: string, replace: string) => void;
  onCancel: () => void;
}

export const ReplacementEditor: React.FC<ReplacementEditorProps> = ({
  initialSearch,
  initialReplace,
  isEditing,
  disabled,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState(initialSearch);
  const [replace, setReplace] = useState(initialReplace);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (search.length > 0 && !disabled) {
      onSave(search, replace);
    }
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
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("settings.replacements.editor.searchPlaceholder")}
            disabled={disabled}
            autoFocus
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-mid-gray">
            {t("settings.replacements.editor.replaceLabel")}
          </span>
          <Input
            className="w-full"
            value={replace}
            onChange={(event) => setReplace(event.target.value)}
            placeholder={t("settings.replacements.editor.replacePlaceholder")}
            disabled={disabled}
          />
        </label>
      </div>
      <p className="text-xs text-mid-gray">
        {t("settings.replacements.editor.emptyReplacementHint")}
      </p>
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
          disabled={search.length === 0 || disabled}
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
