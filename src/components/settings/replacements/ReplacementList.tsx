import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import type { Replacement } from "@/bindings";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { ReplacementRow } from "./ReplacementRow";

interface ReplacementListProps {
  replacements: Replacement[];
  recentlyImportedIndices: ReadonlySet<number>;
  editingIndex: number | null;
  editor: React.ReactNode;
  disabled: boolean;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggle: (index: number) => void;
  onDuplicate: (index: number) => void;
  onReorder: (sourceIndex: number, targetIndex: number) => void;
}

function normalizedSearch(replacement: Replacement): string {
  return replacement.search.trim().toLocaleLowerCase();
}

export const ReplacementList: React.FC<ReplacementListProps> = ({
  replacements,
  recentlyImportedIndices,
  editingIndex,
  editor,
  disabled,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onReorder,
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const normalizedFilter = filter.toLocaleLowerCase();
  const duplicateSearches = useMemo(() => {
    const countBySearch = new Map<string, number>();
    replacements.forEach((replacement) => {
      const search = normalizedSearch(replacement);
      countBySearch.set(search, (countBySearch.get(search) ?? 0) + 1);
    });
    return new Set(
      [...countBySearch.entries()]
        .filter(([, count]) => count > 1)
        .map(([search]) => search),
    );
  }, [replacements]);
  const visibleReplacements = replacements
    .map((replacement, index) => ({ replacement, index }))
    .filter(({ replacement }) => {
      if (normalizedFilter.length === 0) {
        return true;
      }
      return (
        replacement.search.toLocaleLowerCase().includes(normalizedFilter) ||
        replacement.replace.toLocaleLowerCase().includes(normalizedFilter)
      );
    });
  const reorderingDisabled = disabled || normalizedFilter.length > 0;
  const resetDragState = () => {
    setDraggingIndex(null);
    setDropTargetIndex(null);
  };
  const handleDrop = (targetIndex: number) => {
    if (draggingIndex !== null && draggingIndex !== targetIndex) {
      onReorder(draggingIndex, targetIndex);
    }
    resetDragState();
  };
  return (
    <div>
      <div className="relative px-4 py-2">
        <Search
          className="pointer-events-none absolute start-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mid-gray"
          aria-hidden="true"
        />
        <Input
          className="w-full ps-8 pe-9"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t("settings.replacements.filter.placeholder")}
          aria-label={t("settings.replacements.filter.placeholder")}
          disabled={disabled}
          variant="compact"
        />
        {filter.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute end-4 top-1/2 -translate-y-1/2"
            onClick={() => setFilter("")}
            aria-label={t("settings.replacements.filter.clear")}
            title={t("settings.replacements.filter.clear")}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
      {visibleReplacements.length === 0 ? (
        <p
          role="status"
          className="px-4 py-8 text-center text-sm text-mid-gray"
        >
          {t("settings.replacements.filter.noResults")}
        </p>
      ) : (
        <div role="list">
          {visibleReplacements.map(({ replacement, index }) => (
            <div key={`${index}-${replacement.search}`} role="listitem">
              <ReplacementRow
                replacement={replacement}
                disabled={disabled}
                isEditing={editingIndex === index}
                isDuplicate={duplicateSearches.has(
                  normalizedSearch(replacement),
                )}
                isRecentlyImported={recentlyImportedIndices.has(index)}
                isDragging={draggingIndex === index}
                isDropTarget={
                  dropTargetIndex === index && draggingIndex !== index
                }
                reorderingDisabled={reorderingDisabled}
                canMoveUp={index > 0}
                canMoveDown={index < replacements.length - 1}
                onEdit={() => onEdit(index)}
                onDelete={() => onDelete(index)}
                onToggle={() => onToggle(index)}
                onDuplicate={() => onDuplicate(index)}
                onMoveUp={() => onReorder(index, index - 1)}
                onMoveDown={() => onReorder(index, index + 1)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  setDraggingIndex(index);
                }}
                onDragEnter={() => {
                  if (!reorderingDisabled) {
                    setDropTargetIndex(index);
                  }
                }}
                onDragEnd={resetDragState}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(index);
                }}
              />
              {editingIndex === index && (
                <div className="mx-4 mb-3 overflow-hidden rounded-lg border border-logo-primary/30">
                  {editor}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
