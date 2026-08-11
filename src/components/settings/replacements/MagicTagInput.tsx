import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";

interface MagicTagInputProps {
  value: string;
  disabled: boolean;
  placeholder: string;
  onChange: (value: string) => void;
}

interface MagicTag {
  name: string;
  insertion: string;
  cursorOffsetFromEnd?: number;
  descriptionKey: string;
}

interface ActiveMagicQuery {
  start: number;
  end: number;
  query: string;
}

const MAGIC_TAGS: MagicTag[] = [
  {
    name: "date",
    insertion: "[date]",
    descriptionKey: "settings.replacements.magic.date",
  },
  {
    name: "time",
    insertion: "[time]",
    descriptionKey: "settings.replacements.magic.time",
  },
  {
    name: "lowercase",
    insertion: "[lowercase]",
    descriptionKey: "settings.replacements.magic.lowercase",
  },
  {
    name: "lowcase",
    insertion: "[lowcase]",
    descriptionKey: "settings.replacements.magic.lowcase",
  },
  {
    name: "uppercase",
    insertion: "[uppercase]",
    descriptionKey: "settings.replacements.magic.uppercase",
  },
  {
    name: "capitalize",
    insertion: "[capitalize]",
    descriptionKey: "settings.replacements.magic.capitalize",
  },
  {
    name: "nospace",
    insertion: "[nospace]",
    descriptionKey: "settings.replacements.magic.nospace",
  },
  {
    name: "run",
    insertion: '[run]""',
    cursorOffsetFromEnd: 1,
    descriptionKey: "settings.replacements.magic.run",
  },
];

function getActiveMagicQuery(
  value: string,
  caretPosition: number,
): ActiveMagicQuery | null {
  const textBeforeCaret = value.slice(0, caretPosition);
  const start = textBeforeCaret.lastIndexOf("[");
  if (start < 0) {
    return null;
  }
  const query = textBeforeCaret.slice(start + 1);
  if (query.includes("]") || /["']/.test(query)) {
    return null;
  }
  return { start, end: caretPosition, query: query.toLocaleLowerCase() };
}

export const MagicTagInput: React.FC<MagicTagInputProps> = ({
  value,
  disabled,
  placeholder,
  onChange,
}) => {
  const { t } = useTranslation();
  const inputId = useId();
  const listboxId = useId();
  const [caretPosition, setCaretPosition] = useState(value.length);
  const [suggestionsAreDismissed, setSuggestionsAreDismissed] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const activeQuery = getActiveMagicQuery(value, caretPosition);
  const suggestions =
    activeQuery === null || suggestionsAreDismissed
      ? []
      : MAGIC_TAGS.filter((tag) => tag.name.startsWith(activeQuery.query));
  const selectSuggestion = (tag: MagicTag) => {
    if (activeQuery === null) {
      return;
    }
    const nextValue =
      value.slice(0, activeQuery.start) +
      tag.insertion +
      value.slice(activeQuery.end);
    const nextCaretPosition =
      activeQuery.start + tag.insertion.length - (tag.cursorOffsetFromEnd ?? 0);
    onChange(nextValue);
    setCaretPosition(nextCaretPosition);
    setSuggestionsAreDismissed(true);
    requestAnimationFrame(() => {
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      input?.focus();
      input?.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setSelectedSuggestionIndex(
        (selectedSuggestionIndex + direction + suggestions.length) %
          suggestions.length,
      );
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      selectSuggestion(suggestions[selectedSuggestionIndex]);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setSuggestionsAreDismissed(true);
    }
  };
  return (
    <div className="relative">
      <input
        id={inputId}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={
          suggestions.length > 0
            ? `${listboxId}-${selectedSuggestionIndex}`
            : undefined
        }
        className="w-full rounded-md border border-mid-gray/80 bg-mid-gray/10 px-3 py-2 text-start text-sm font-semibold transition-all duration-150 hover:border-logo-primary hover:bg-logo-primary/10 focus:border-logo-primary focus:bg-logo-primary/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          setCaretPosition(
            event.target.selectionStart ?? event.target.value.length,
          );
          setSelectedSuggestionIndex(0);
          setSuggestionsAreDismissed(false);
        }}
        onClick={(event) => {
          setCaretPosition(event.currentTarget.selectionStart ?? value.length);
          setSuggestionsAreDismissed(false);
        }}
        onKeyDown={handleKeyDown}
      />
      {suggestions.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-mid-gray/40 bg-background shadow-lg"
        >
          {suggestions.map((tag, index) => (
            <button
              id={`${listboxId}-${index}`}
              key={tag.name}
              type="button"
              role="option"
              aria-selected={selectedSuggestionIndex === index}
              className={`flex w-full items-start gap-3 px-3 py-2 text-start text-xs hover:bg-logo-primary/10 ${
                selectedSuggestionIndex === index ? "bg-logo-primary/20" : ""
              }`}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(tag)}
            >
              <code className="shrink-0 font-semibold">{tag.insertion}</code>
              <span className="text-mid-gray">{t(tag.descriptionKey)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
