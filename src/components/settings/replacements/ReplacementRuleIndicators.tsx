import React from "react";
import { useTranslation } from "react-i18next";
import {
  CaseLower,
  CaseUpper,
  Regex,
  Scissors,
  Space,
  Wand2,
} from "lucide-react";
import type { Replacement } from "@/bindings";

interface ReplacementRuleIndicatorsProps {
  replacement: Replacement;
  replacementUsesMagic: boolean;
  isDuplicate: boolean;
  isRecentlyImported: boolean;
}

interface ReplacementIndicatorProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  title: string;
  tone: "neutral" | "blue" | "purple" | "cyan" | "green" | "red" | "yellow";
}

const toneClassesByName: Record<ReplacementIndicatorProps["tone"], string> = {
  neutral: "bg-mid-gray/10 text-mid-gray",
  blue: "bg-blue-500/10 text-blue-400",
  purple: "bg-purple-500/10 text-purple-400",
  cyan: "bg-cyan-500/10 text-cyan-400",
  green: "bg-emerald-500/10 text-emerald-400",
  red: "bg-red-500/10 text-red-400",
  yellow: "bg-yellow-500/10 text-yellow-400",
};

const ReplacementIndicator: React.FC<ReplacementIndicatorProps> = ({
  icon,
  label,
  title,
  tone,
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${toneClassesByName[tone]}`}
    title={title}
  >
    {icon}
    {label}
  </span>
);

function getConfiguredSides(
  beforeIsConfigured: boolean | undefined,
  afterIsConfigured: boolean | undefined,
): string {
  return `${beforeIsConfigured ? "←" : ""}${afterIsConfigured ? "→" : ""}`;
}

export const ReplacementRuleIndicators: React.FC<
  ReplacementRuleIndicatorsProps
> = ({
  replacement,
  replacementUsesMagic,
  isDuplicate,
  isRecentlyImported,
}) => {
  const { t } = useTranslation();
  const replacementIsEnabled = replacement.enabled ?? true;
  const punctuationSides = getConfiguredSides(
    replacement.trim_punctuation_before,
    replacement.trim_punctuation_after,
  );
  const spaceSides = getConfiguredSides(
    replacement.trim_spaces_before,
    replacement.trim_spaces_after,
  );
  const capitalizationRule = replacement.capitalization_rule ?? "none";
  const capitalizationLabel =
    capitalizationRule === "force_uppercase"
      ? t("settings.replacements.editor.capitalization.uppercase")
      : t("settings.replacements.editor.capitalization.lowercase");
  const capitalizationIcon =
    capitalizationRule === "force_uppercase" ? (
      <CaseUpper className="h-3 w-3" aria-hidden="true" />
    ) : (
      <CaseLower className="h-3 w-3" aria-hidden="true" />
    );
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {isRecentlyImported && (
        <ReplacementIndicator
          label={t("settings.replacements.rule.importedBadge")}
          title={t("settings.replacements.rule.importedBadge")}
          tone="green"
        />
      )}
      {replacement.is_regex && (
        <ReplacementIndicator
          icon={<Regex className="h-3 w-3" aria-hidden="true" />}
          label={t("settings.replacements.rule.regexBadge")}
          title={t("settings.replacements.editor.regexLabel")}
          tone="blue"
        />
      )}
      {replacementUsesMagic && (
        <ReplacementIndicator
          icon={<Wand2 className="h-3 w-3" aria-hidden="true" />}
          label={t("settings.replacements.rule.magicBadge")}
          title={t("settings.replacements.rule.magicBadge")}
          tone="purple"
        />
      )}
      {punctuationSides.length > 0 && (
        <ReplacementIndicator
          icon={<Scissors className="h-3 w-3" aria-hidden="true" />}
          label={punctuationSides}
          title={t("settings.replacements.editor.trimPunctuationLabel")}
          tone="cyan"
        />
      )}
      {spaceSides.length > 0 && (
        <ReplacementIndicator
          icon={<Space className="h-3 w-3" aria-hidden="true" />}
          label={spaceSides}
          title={t("settings.replacements.editor.trimSpacesLabel")}
          tone="cyan"
        />
      )}
      {capitalizationRule !== "none" && (
        <ReplacementIndicator
          icon={capitalizationIcon}
          label={t("settings.replacements.rule.capitalizationBadge")}
          title={capitalizationLabel}
          tone="neutral"
        />
      )}
      {!replacementIsEnabled && (
        <ReplacementIndicator
          label={t("settings.replacements.rule.disabledBadge")}
          title={t("settings.replacements.rule.disabledBadge")}
          tone="red"
        />
      )}
      {isDuplicate && (
        <ReplacementIndicator
          label={t("settings.replacements.rule.duplicateBadge")}
          title={t("settings.replacements.rule.duplicateBadge")}
          tone="yellow"
        />
      )}
    </div>
  );
};
