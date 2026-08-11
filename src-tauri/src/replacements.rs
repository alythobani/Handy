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

impl Replacement {
    fn has_context_options(&self) -> bool {
        self.trim_punctuation_before
            || self.trim_punctuation_after
            || self.trim_spaces_before
            || self.trim_spaces_after
            || self.capitalization_rule != CapitalizationRule::None
    }
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
    if replacement.has_context_options() {
        return Some(apply_contextual_replacement(
            text,
            &search_regex,
            replacement,
            &replacement_text,
        ));
    }
    let replaced_text = if replacement.is_regex {
        search_regex.replace_all(text, replacement_text.as_str())
    } else {
        search_regex.replace_all(text, NoExpand(&replacement_text))
    };
    Some(replaced_text.into_owned())
}

fn apply_contextual_replacement(
    text: &str,
    search_regex: &Regex,
    replacement: &Replacement,
    replacement_text: &str,
) -> String {
    let mut output = String::new();
    let mut cursor = 0;
    for captures in search_regex.captures_iter(text) {
        let matched_text = captures
            .get(0)
            .expect("every regex capture set includes the full match");
        if matched_text.start() < cursor {
            continue;
        }
        append_processed_prefix(
            &mut output,
            &text[cursor..matched_text.start()],
            replacement,
        );
        if replacement.is_regex {
            captures.expand(replacement_text, &mut output);
        } else {
            output.push_str(replacement_text);
        }
        cursor = matched_text.end();
        trim_text_after_match(text, &mut cursor, &mut output, replacement);
        append_next_word_initial(
            text,
            &mut cursor,
            &mut output,
            replacement.capitalization_rule,
        );
    }
    output.push_str(&text[cursor..]);
    output
}

fn append_processed_prefix(output: &mut String, prefix: &str, replacement: &Replacement) {
    let content_end = prefix.trim_end_matches(is_horizontal_whitespace).len();
    let punctuation_start = prefix[..content_end]
        .trim_end_matches(is_replacement_punctuation)
        .len();
    let punctuation_was_found = punctuation_start < content_end;
    if replacement.trim_punctuation_before && punctuation_was_found {
        output.push_str(&prefix[..punctuation_start]);
        if !replacement.trim_spaces_before {
            output.push_str(&prefix[content_end..]);
        }
    } else if replacement.trim_spaces_before {
        output.push_str(&prefix[..content_end]);
    } else {
        output.push_str(prefix);
    }
}

fn trim_text_after_match(
    text: &str,
    cursor: &mut usize,
    output: &mut String,
    replacement: &Replacement,
) {
    if replacement.trim_punctuation_after {
        let horizontal_spaces_end =
            *cursor + leading_matching_bytes(&text[*cursor..], is_horizontal_whitespace);
        let punctuation_end = horizontal_spaces_end
            + leading_matching_bytes(&text[horizontal_spaces_end..], is_replacement_punctuation);
        if punctuation_end > horizontal_spaces_end {
            if !replacement.trim_spaces_after {
                output.push_str(&text[*cursor..horizontal_spaces_end]);
            }
            *cursor = punctuation_end;
        }
    }
    if replacement.trim_spaces_after {
        *cursor += leading_matching_bytes(&text[*cursor..], is_horizontal_whitespace);
    }
}

fn append_next_word_initial(
    text: &str,
    cursor: &mut usize,
    output: &mut String,
    capitalization_rule: CapitalizationRule,
) {
    if capitalization_rule == CapitalizationRule::None {
        return;
    }
    let remainder = &text[*cursor..];
    let Some((initial_offset, initial)) = remainder
        .char_indices()
        .find(|(_, character)| !character.is_whitespace())
    else {
        output.push_str(remainder);
        *cursor = text.len();
        return;
    };
    output.push_str(&remainder[..initial_offset]);
    match capitalization_rule {
        CapitalizationRule::None => unreachable!("none returns before transforming a character"),
        CapitalizationRule::ForceUppercase => output.extend(initial.to_uppercase()),
        CapitalizationRule::ForceLowercase => output.extend(initial.to_lowercase()),
    }
    *cursor += initial_offset + initial.len_utf8();
}

fn leading_matching_bytes(text: &str, predicate: fn(char) -> bool) -> usize {
    text.chars()
        .take_while(|character| predicate(*character))
        .map(char::len_utf8)
        .sum()
}

fn is_horizontal_whitespace(character: char) -> bool {
    matches!(character, ' ' | '\t')
}

fn is_replacement_punctuation(character: char) -> bool {
    character.is_ascii_punctuation() || matches!(character, '«' | '»' | '—' | '…' | '’' | '“' | '”')
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

    fn replacement_with_options(
        search: &str,
        replace: &str,
        configure: impl FnOnce(&mut Replacement),
    ) -> Replacement {
        let mut replacement = literal_replacement(search, replace);
        configure(&mut replacement);
        replacement
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

    #[test]
    fn punctuation_before_is_removed_while_horizontal_spaces_are_preserved() {
        let replacements = [replacement_with_options("target", "word", |replacement| {
            replacement.trim_punctuation_before = true;
        })];
        assert_eq!(
            apply_replacements("hello, \ttarget", &replacements),
            "hello \tword"
        );
    }

    #[test]
    fn punctuation_after_is_removed_while_horizontal_spaces_are_preserved() {
        let replacements = [replacement_with_options("target", "word", |replacement| {
            replacement.trim_punctuation_after = true;
        })];
        assert_eq!(
            apply_replacements("target \t, next", &replacements),
            "word \t next"
        );
    }

    #[test]
    fn punctuation_trimming_uses_the_same_unicode_set_on_both_sides() {
        let replacements = [replacement_with_options("target", "word", |replacement| {
            replacement.trim_punctuation_before = true;
            replacement.trim_punctuation_after = true;
        })];
        assert_eq!(
            apply_replacements("hello—target…next", &replacements),
            "hellowordnext"
        );
    }

    #[test]
    fn punctuation_trimming_does_not_cross_line_boundaries() {
        let replacements = [replacement_with_options("target", "word", |replacement| {
            replacement.trim_punctuation_before = true;
            replacement.trim_punctuation_after = true;
        })];
        assert_eq!(
            apply_replacements("hello.\ntarget\n,next", &replacements),
            "hello.\nword\n,next"
        );
    }

    #[test]
    fn horizontal_spaces_can_be_trimmed_on_both_sides() {
        let replacements = [replacement_with_options("target", "word", |replacement| {
            replacement.trim_spaces_before = true;
            replacement.trim_spaces_after = true;
        })];
        assert_eq!(
            apply_replacements("hello \t target \t world", &replacements),
            "hellowordworld"
        );
    }

    #[test]
    fn uppercase_rule_transforms_the_next_word_after_all_whitespace() {
        let replacements = [replacement_with_options("trigger", "done", |replacement| {
            replacement.capitalization_rule = CapitalizationRule::ForceUppercase;
        })];
        assert_eq!(
            apply_replacements("trigger \t  lower", &replacements),
            "done \t  Lower"
        );
    }

    #[test]
    fn lowercase_rule_supports_unicode_word_initials() {
        let replacements = [replacement_with_options("trigger", "done", |replacement| {
            replacement.capitalization_rule = CapitalizationRule::ForceLowercase;
        })];
        assert_eq!(
            apply_replacements("trigger ÉCLAIR", &replacements),
            "done éCLAIR"
        );
    }

    #[test]
    fn regex_captures_expand_when_context_options_are_enabled() {
        let mut replacement = regex_replacement(r"(\d+)", "[$1]");
        replacement.trim_punctuation_after = true;
        replacement.capitalization_rule = CapitalizationRule::ForceUppercase;
        assert_eq!(
            apply_replacements("ID 42, next", &[replacement]),
            "ID [42] Next"
        );
    }

    #[test]
    fn context_options_apply_to_every_match() {
        let replacements = [replacement_with_options("x", "y", |replacement| {
            replacement.trim_punctuation_after = true;
            replacement.capitalization_rule = CapitalizationRule::ForceUppercase;
        })];
        assert_eq!(
            apply_replacements("x, alpha; x, beta", &replacements),
            "y Alpha; y Beta"
        );
    }
}
