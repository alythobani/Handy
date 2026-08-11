import React from "react";
import { useTranslation } from "react-i18next";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Replacement } from "@/bindings";
import { Button } from "../../ui/Button";

interface ReplacementTransferActionsProps {
  replacements: Replacement[];
  disabled: boolean;
  onImport: (replacements: Replacement[]) => void;
}

function isReplacement(value: unknown): value is Replacement {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.search === "string" &&
    typeof candidate.replace === "string"
  );
}

function parseReplacementFile(contents: string): Replacement[] | null {
  const parsedContents: unknown = JSON.parse(contents);
  if (!Array.isArray(parsedContents) || !parsedContents.every(isReplacement)) {
    return null;
  }
  return parsedContents;
}

export const ReplacementTransferActions: React.FC<
  ReplacementTransferActionsProps
> = ({ replacements, disabled, onImport }) => {
  const { t } = useTranslation();
  const jsonFilter = {
    name: t("settings.replacements.transfer.jsonFiles"),
    extensions: ["json"],
  };
  const handleExport = async () => {
    try {
      const exportPath = await save({
        title: t("settings.replacements.transfer.exportTitle"),
        defaultPath: "handy-replacements.json",
        filters: [jsonFilter],
      });
      if (exportPath === null) {
        return;
      }
      await writeTextFile(exportPath, JSON.stringify(replacements, null, 2));
      toast.success(t("settings.replacements.transfer.exportSuccess"));
    } catch (error) {
      console.error("Failed to export replacements", error);
      toast.error(t("settings.replacements.transfer.exportError"));
    }
  };
  const handleImport = async () => {
    try {
      const importPath = await open({
        title: t("settings.replacements.transfer.importTitle"),
        multiple: false,
        directory: false,
        filters: [jsonFilter],
        fileAccessMode: "scoped",
      });
      if (importPath === null) {
        return;
      }
      const importedReplacements = parseReplacementFile(
        await readTextFile(importPath),
      );
      if (importedReplacements === null) {
        toast.error(t("settings.replacements.transfer.invalidFile"));
        return;
      }
      onImport(importedReplacements);
      toast.success(
        t("settings.replacements.transfer.importSuccess", {
          count: importedReplacements.length,
        }),
      );
    } catch (error) {
      console.error("Failed to import replacements", error);
      toast.error(t("settings.replacements.transfer.importError"));
    }
  };
  return (
    <div className="flex gap-2 border-t border-mid-gray/20 px-4 py-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void handleExport()}
        disabled={disabled}
        className="inline-flex items-center gap-2"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        {t("settings.replacements.transfer.export")}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void handleImport()}
        disabled={disabled}
        className="inline-flex items-center gap-2"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {t("settings.replacements.transfer.import")}
      </Button>
    </div>
  );
};
