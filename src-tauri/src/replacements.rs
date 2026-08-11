use regex::{NoExpand, Regex};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::borrow::Cow;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Type, Default)]
#[serde(rename_all = "snake_case")]
pub enum CapitalizationRule {
    #[default]
    None,
    ForceUppercase,
    ForceLowercase,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct Replacement {
    pub search: String,
    pub replace: String,
    #[serde(default)]
    pub is_regex: bool,
    #[serde(default)]
    pub trim_punctuation_before: bool,
    #[serde(default)]
    pub trim_punctuation_after: bool,
    #[serde(default)]
    pub trim_spaces_before: bool,
    #[serde(default)]
    pub trim_spaces_after: bool,
    #[serde(default)]
    pub capitalization_rule: CapitalizationRule,
    #[serde(default = "default_replacement_enabled")]
    pub enabled: bool,
}

fn default_replacement_enabled() -> bool {
    true
}

pub fn apply_replacements(text: &str, replacements: &[Replacement]) -> String {
    replacements
        .iter()
        .filter(|replacement| replacement.enabled)
        .fold(text.to_string(), |current_text, replacement| {
            apply_replacement(&current_text, replacement).unwrap_or(current_text)
        })
}

fn apply_replacement(text: &str, replacement: &Replacement) -> Option<String> {
    let search_regex = build_search_regex(replacement).ok()?;
    let replacement_text = replacement.replace.replace("\\n", "\n");
    let replaced_text = if replacement.is_regex {
        search_regex.replace_all(text, replacement_text.as_str())
    } else {
        search_regex.replace_all(text, NoExpand(&replacement_text))
    };
    Some(replaced_text.into_owned())
}

fn build_search_regex(replacement: &Replacement) -> Result<Regex, regex::Error> {
    if replacement.is_regex {
        Regex::new(&replacement.search)
    } else {
        Regex::new(&build_literal_search_pattern(&replacement.search))
    }
}

fn build_literal_search_pattern(search: &str) -> String {
    let mut pattern = String::from("(?i)");
    for character in search.chars() {
        pattern.push_str(accent_insensitive_pattern(character).as_ref());
    }
    pattern
}

fn accent_insensitive_pattern(character: char) -> Cow<'static, str> {
    match character {
        'a' | 'A' | 'à' | 'À' | 'á' | 'Á' | 'â' | 'Â' | 'ã' | 'Ã' | 'ä' | 'Ä' | 'å' | 'Å' => {
            Cow::Borrowed("[aàáâãäå]")
        }
        'e' | 'E' | 'è' | 'È' | 'é' | 'É' | 'ê' | 'Ê' | 'ë' | 'Ë' => {
            Cow::Borrowed("[eèéêë]")
        }
        'i' | 'I' | 'ì' | 'Ì' | 'í' | 'Í' | 'î' | 'Î' | 'ï' | 'Ï' => {
            Cow::Borrowed("[iìíîï]")
        }
        'o' | 'O' | 'ò' | 'Ò' | 'ó' | 'Ó' | 'ô' | 'Ô' | 'õ' | 'Õ' | 'ö' | 'Ö' => {
            Cow::Borrowed("[oòóôõö]")
        }
        'u' | 'U' | 'ù' | 'Ù' | 'ú' | 'Ú' | 'û' | 'Û' | 'ü' | 'Ü' => {
            Cow::Borrowed("[uùúûü]")
        }
        'y' | 'Y' | 'ý' | 'Ý' | 'ÿ' | 'Ÿ' => Cow::Borrowed("[yýÿ]"),
        'c' | 'C' | 'ç' | 'Ç' => Cow::Borrowed("[cç]"),
        'n' | 'N' | 'ñ' | 'Ñ' => Cow::Borrowed("[nñ]"),
        _ => Cow::Owned(regex::escape(&character.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn literal_replacement(search: &str, replace: &str) -> Replacement {
        Replacement {
            search: search.to_string(),
            replace: replace.to_string(),
            is_regex: false,
            trim_punctuation_before: false,
            trim_punctuation_after: false,
            trim_spaces_before: false,
            trim_spaces_after: false,
            capitalization_rule: CapitalizationRule::None,
            enabled: true,
        }
    }

    fn regex_replacement(search: &str, replace: &str) -> Replacement {
        Replacement {
            is_regex: true,
            ..literal_replacement(search, replace)
        }
    }

    #[test]
    fn literal_replacements_are_case_and_accent_insensitive() {
        let replacements = [literal_replacement("resume", "CV")];
        assert_eq!(
            apply_replacements("Resume résumé RÉSUMÉ", &replacements),
            "CV CV CV"
        );
    }

    #[test]
    fn literal_replacement_values_treat_dollar_signs_literally() {
        let replacements = [literal_replacement("five dollars", "$5")];
        assert_eq!(apply_replacements("five dollars", &replacements), "$5");
    }

    #[test]
    fn literal_replacements_can_delete_matches() {
        let replacements = [literal_replacement(" unwanted", "")];
        assert_eq!(
            apply_replacements("keep unwanted text", &replacements),
            "keep text"
        );
    }

    #[test]
    fn regex_replacements_expand_capture_groups_for_every_match() {
        let replacements = [regex_replacement(r"(\d+)", "[$1]")];
        assert_eq!(
            apply_replacements("12 and 34", &replacements),
            "[12] and [34]"
        );
    }

    #[test]
    fn replacements_run_in_stored_order() {
        let replacements = [
            literal_replacement("cat", "dog"),
            literal_replacement("dog", "fox"),
        ];
        assert_eq!(apply_replacements("cat", &replacements), "fox");
    }

    #[test]
    fn disabled_replacements_are_skipped() {
        let mut disabled_replacement = literal_replacement("cat", "dog");
        disabled_replacement.enabled = false;
        assert_eq!(apply_replacements("cat", &[disabled_replacement]), "cat");
    }

    #[test]
    fn invalid_regexes_fail_open_without_stopping_later_rules() {
        let replacements = [
            regex_replacement("[", "invalid"),
            literal_replacement("cat", "dog"),
        ];
        assert_eq!(apply_replacements("cat", &replacements), "dog");
    }

    #[test]
    fn escaped_newlines_in_replacement_values_become_line_breaks() {
        let replacements = [literal_replacement("new paragraph", "\\n")];
        assert_eq!(
            apply_replacements("one new paragraph two", &replacements),
            "one \n two"
        );
    }
}
