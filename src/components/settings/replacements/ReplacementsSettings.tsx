import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { Replacement } from "@/bindings";
import { useSettings } from "../../../hooks/useSettings";
import { Button } from "../../ui/Button";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { ToggleSwitch } from "../../ui/ToggleSwitch";
import { ReplacementEditor } from "./ReplacementEditor";
import { ReplacementList } from "./ReplacementList";
import { ReplacementTransferActions } from "./ReplacementTransferActions";
import {
  createEmptyReplacement,
  type CompleteReplacement,
} from "./replacementDefaults";
import {
  getIndexAfterDeletion,
  getIndexAfterInsertion,
  getIndexAfterMove,
  mapReplacementIndices,
} from "./replacementIndices";

interface ActiveEditor {
  index: number | null;
}

export const ReplacementsSettings: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating } = useSettings();
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [recentlyImportedIndices, setRecentlyImportedIndices] = useState<
    Set<number>
  >(new Set());
  const replacements = getSetting("replacements") ?? [];
  const replacementsEnabled = getSetting("replacements_enabled") ?? true;
  const replacementsAreUpdating = isUpdating("replacements");
  const editingReplacement =
    activeEditor?.index != null ? replacements[activeEditor.index] : undefined;
  const handleSave = (replacement: CompleteReplacement) => {
    if (activeEditor === null) {
      return;
    }
    const updatedReplacements =
      activeEditor.index === null
        ? [...replacements, replacement]
        : replacements.map((currentReplacement, index) =>
            index === activeEditor.index ? replacement : currentReplacement,
          );
    void updateSetting("replacements", updatedReplacements);
    setRecentlyImportedIndices(new Set());
    setActiveEditor(null);
  };
  const handleDelete = (deletedIndex: number) => {
    void updateSetting(
      "replacements",
      replacements.filter((_, index) => index !== deletedIndex),
    );
    setActiveEditor((currentEditor) => {
      if (currentEditor?.index == null) {
        return currentEditor;
      }
      const updatedIndex = getIndexAfterDeletion(
        currentEditor.index,
        deletedIndex,
      );
      return updatedIndex === null ? null : { index: updatedIndex };
    });
    setRecentlyImportedIndices((currentIndices) =>
      mapReplacementIndices(currentIndices, (index) =>
        getIndexAfterDeletion(index, deletedIndex),
      ),
    );
  };
  const handleToggle = (toggledIndex: number) => {
    void updateSetting(
      "replacements",
      replacements.map((replacement, index) =>
        index === toggledIndex
          ? { ...replacement, enabled: !(replacement.enabled ?? true) }
          : replacement,
      ),
    );
  };
  const handleDuplicate = (duplicatedIndex: number) => {
    const updatedReplacements = [...replacements];
    updatedReplacements.splice(duplicatedIndex + 1, 0, {
      ...replacements[duplicatedIndex],
    });
    void updateSetting("replacements", updatedReplacements);
    setActiveEditor((currentEditor) => {
      if (currentEditor?.index == null) {
        return currentEditor;
      }
      return {
        index: getIndexAfterInsertion(currentEditor.index, duplicatedIndex + 1),
      };
    });
    setRecentlyImportedIndices((currentIndices) =>
      mapReplacementIndices(currentIndices, (index) =>
        getIndexAfterInsertion(index, duplicatedIndex + 1),
      ),
    );
  };
  const handleReorder = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) {
      return;
    }
    const updatedReplacements = [...replacements];
    const [movedReplacement] = updatedReplacements.splice(sourceIndex, 1);
    updatedReplacements.splice(targetIndex, 0, movedReplacement);
    void updateSetting("replacements", updatedReplacements);
    setActiveEditor((currentEditor) => {
      if (currentEditor?.index == null) {
        return currentEditor;
      }
      return {
        index: getIndexAfterMove(currentEditor.index, sourceIndex, targetIndex),
      };
    });
    setRecentlyImportedIndices((currentIndices) =>
      mapReplacementIndices(currentIndices, (index) =>
        getIndexAfterMove(index, sourceIndex, targetIndex),
      ),
    );
  };
  const handleImport = (importedReplacements: Replacement[]) => {
    const firstImportedIndex = replacements.length;
    void updateSetting("replacements", [
      ...replacements,
      ...importedReplacements,
    ]);
    setRecentlyImportedIndices(
      new Set(
        importedReplacements.map((_, index) => firstImportedIndex + index),
      ),
    );
    setActiveEditor(null);
  };
  const replacementEditor = activeEditor !== null && (
    <ReplacementEditor
      key={activeEditor.index ?? "new"}
      initialReplacement={editingReplacement ?? createEmptyReplacement()}
      isEditing={activeEditor.index !== null}
      disabled={replacementsAreUpdating}
      onSave={handleSave}
      onCancel={() => setActiveEditor(null)}
    />
  );
  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <SettingsGroup title={t("settings.replacements.groups.behavior")}>
        <ToggleSwitch
          checked={replacementsEnabled}
          onChange={(enabled) =>
            void updateSetting("replacements_enabled", enabled)
          }
          isUpdating={isUpdating("replacements_enabled")}
          label={t("settings.replacements.enable.label")}
          description={t("settings.replacements.enable.description")}
          grouped
        />
      </SettingsGroup>
      <SettingsGroup
        title={t("settings.replacements.groups.rules")}
        description={t("settings.replacements.rulesDescription")}
      >
        <div className="flex items-center justify-end px-4 py-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setActiveEditor({ index: null })}
            disabled={activeEditor !== null || replacementsAreUpdating}
            className="inline-flex items-center gap-1"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("settings.replacements.addNew")}
          </Button>
        </div>
        {activeEditor?.index === null && replacementEditor}
        {replacements.length === 0 && activeEditor === null ? (
          <p className="px-4 py-8 text-center text-sm text-mid-gray">
            {t("settings.replacements.emptyState")}
          </p>
        ) : replacements.length > 0 ? (
          <ReplacementList
            replacements={replacements}
            recentlyImportedIndices={recentlyImportedIndices}
            editingIndex={activeEditor?.index ?? null}
            editor={activeEditor?.index != null ? replacementEditor : null}
            disabled={replacementsAreUpdating}
            onEdit={(index) => setActiveEditor({ index })}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onDuplicate={handleDuplicate}
            onReorder={handleReorder}
          />
        ) : null}
        <ReplacementTransferActions
          replacements={replacements}
          disabled={replacementsAreUpdating}
          onImport={handleImport}
        />
      </SettingsGroup>
    </div>
  );
};
