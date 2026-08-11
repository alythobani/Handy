import type { Replacement } from "@/bindings";

export type CompleteReplacement = Required<Replacement>;

export function completeReplacement(
  replacement: Replacement,
): CompleteReplacement {
  return {
    search: replacement.search,
    replace: replacement.replace,
    is_regex: replacement.is_regex ?? false,
    trim_punctuation_before: replacement.trim_punctuation_before ?? false,
    trim_punctuation_after: replacement.trim_punctuation_after ?? false,
    trim_spaces_before: replacement.trim_spaces_before ?? false,
    trim_spaces_after: replacement.trim_spaces_after ?? false,
    capitalization_rule: replacement.capitalization_rule ?? "none",
    enabled: replacement.enabled ?? true,
  };
}

export function createEmptyReplacement(): CompleteReplacement {
  return completeReplacement({ search: "", replace: "" });
}
