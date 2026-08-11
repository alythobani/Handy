use chrono::Local;
use log::{error, info};
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
    let now = Local::now();
    let current_date = now.format("%Y-%m-%d").to_string();
    let current_time = now.format("%H:%M").to_string();
    let context = ReplacementContext {
        current_date: &current_date,
        current_time: &current_time,
        run_command: &run_shell_command,
    };
    apply_replacements_with_context(text, replacements, &context)
}

struct ReplacementContext<'a> {
    current_date: &'a str,
    current_time: &'a str,
    run_command: &'a dyn Fn(&str) -> bool,
}

struct ReplacementApplication {
    text: String,
    transformations: Vec<MagicTransformation>,
}

#[derive(Debug, PartialEq, Eq)]
enum MagicTransformation {
    Lowercase,
    Uppercase,
    NoSpace,
    Capitalize,
    Run(String),
}

fn apply_replacements_with_context(
    text: &str,
    replacements: &[Replacement],
    context: &ReplacementContext<'_>,
) -> String {
    let mut processed_text = text.to_string();
    let mut transformations = Vec::new();
    for replacement in replacements
        .iter()
        .filter(|replacement| replacement.enabled)
    {
        let Some(application) = apply_replacement(&processed_text, replacement, context) else {
            continue;
        };
        processed_text = application.text;
        transformations.extend(application.transformations);
    }
    apply_magic_transformations(processed_text, &transformations, context)
}

fn apply_replacement(
    text: &str,
    replacement: &Replacement,
    context: &ReplacementContext<'_>,
) -> Option<ReplacementApplication> {
    let search_regex = build_search_regex(replacement).ok()?;
    if !search_regex.is_match(text) {
        return Some(ReplacementApplication {
            text: text.to_string(),
            transformations: Vec::new(),
        });
    }
    let (replacement_text, transformations) =
        parse_magic_transformations(&replacement.replace, context);
    let replacement_text = replacement_text.replace("\\n", "\n");
    if replacement.has_context_options() {
        return Some(ReplacementApplication {
            text: apply_contextual_replacement(text, &search_regex, replacement, &replacement_text),
            transformations,
        });
    }
    let replaced_text = if replacement.is_regex {
        search_regex.replace_all(text, replacement_text.as_str())
    } else {
        search_regex.replace_all(text, NoExpand(&replacement_text))
    };
    Some(ReplacementApplication {
        text: replaced_text.into_owned(),
        transformations,
    })
}

fn parse_magic_transformations(
    replacement_text: &str,
    context: &ReplacementContext<'_>,
) -> (String, Vec<MagicTransformation>) {
    let mut parsed_text = String::new();
    let mut transformations = Vec::new();
    let mut cursor = 0;
    while cursor < replacement_text.len() {
        let remainder = &replacement_text[cursor..];
        if let Some((transformation, consumed_bytes)) = parse_run_transformation(remainder) {
            transformations.push(transformation);
            cursor += consumed_bytes;
            continue;
        }
        let recognized_tag = [
            ("[lowercase]", Some(MagicTransformation::Lowercase)),
            ("[lowcase]", Some(MagicTransformation::Lowercase)),
            ("[uppercase]", Some(MagicTransformation::Uppercase)),
            ("[nospace]", Some(MagicTransformation::NoSpace)),
            ("[capitalize]", Some(MagicTransformation::Capitalize)),
            ("[date]", None),
            ("[time]", None),
        ]
        .into_iter()
        .find(|(tag, _)| remainder.starts_with(tag));
        if let Some((tag, transformation)) = recognized_tag {
            match tag {
                "[date]" => parsed_text.push_str(context.current_date),
                "[time]" => parsed_text.push_str(context.current_time),
                _ => transformations.push(
                    transformation.expect("recognized transformation tags include their action"),
                ),
            }
            cursor += tag.len();
            continue;
        }
        let character = remainder
            .chars()
            .next()
            .expect("a non-empty remainder starts with a character");
        parsed_text.push(character);
        cursor += character.len_utf8();
    }
    (parsed_text, transformations)
}

fn parse_run_transformation(text: &str) -> Option<(MagicTransformation, usize)> {
    let quoted_command = text.strip_prefix("[run]")?;
    let quote = quoted_command.chars().next()?;
    if !matches!(quote, '\'' | '"') {
        return None;
    }
    let command = &quoted_command[quote.len_utf8()..];
    let closing_quote_offset = command.find(quote)?;
    if closing_quote_offset == 0 {
        return None;
    }
    let consumed_bytes = "[run]".len() + quote.len_utf8() + closing_quote_offset + quote.len_utf8();
    Some((
        MagicTransformation::Run(command[..closing_quote_offset].to_string()),
        consumed_bytes,
    ))
}

fn apply_magic_transformations(
    mut text: String,
    transformations: &[MagicTransformation],
    context: &ReplacementContext<'_>,
) -> String {
    let mut output_should_be_suppressed = false;
    for transformation in transformations {
        match transformation {
            MagicTransformation::Lowercase => text = text.to_lowercase(),
            MagicTransformation::Uppercase => text = text.to_uppercase(),
            MagicTransformation::NoSpace => text = text.replace(' ', ""),
            MagicTransformation::Capitalize => text = capitalize_words(&text),
            MagicTransformation::Run(command_template) => {
                let command = interpolate_command(command_template, &text);
                if (context.run_command)(&command) {
                    output_should_be_suppressed = true;
                }
            }
        }
    }
    if output_should_be_suppressed {
        String::new()
    } else {
        text
    }
}

fn capitalize_words(text: &str) -> String {
    let mut output = String::new();
    let mut next_character_starts_a_word = true;
    for character in text.chars() {
        if character.is_whitespace() || is_replacement_punctuation(character) {
            next_character_starts_a_word = true;
            output.push(character);
        } else if next_character_starts_a_word {
            output.extend(character.to_uppercase());
            next_character_starts_a_word = false;
        } else {
            output.push(character);
        }
    }
    output
}

fn interpolate_command(command_template: &str, text: &str) -> String {
    let text_without_spaces = text.replace(' ', "");
    let text_without_punctuation: String = text
        .chars()
        .filter(|character| !is_replacement_punctuation(*character))
        .collect();
    let text_without_spaces_or_punctuation: String = text
        .chars()
        .filter(|character| *character != ' ' && !is_replacement_punctuation(*character))
        .collect();
    command_template
        .replace(
            "{text_nospace_nopunctuation}",
            &text_without_spaces_or_punctuation,
        )
        .replace("{text_nopunctuation}", &text_without_punctuation)
        .replace("{text_nospace}", &text_without_spaces)
        .replace("{text}", text)
}

fn run_shell_command(command: &str) -> bool {
    info!("Executing replacement run command");
    #[cfg(target_os = "windows")]
    let spawn_result = std::process::Command::new("cmd")
        .args(["/C", command])
        .spawn();
    #[cfg(not(target_os = "windows"))]
    let spawn_result = std::process::Command::new("sh")
        .arg("-c")
        .arg(command)
        .spawn();
    match spawn_result {
        Ok(_) => true,
        Err(command_error) => {
            error!("Failed to start replacement run command: {command_error}");
            false
        }
    }
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

pub fn validate_replacement_regex(pattern: &str) -> Result<(), regex::Error> {
    Regex::new(pattern).map(|_| ())
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
    use std::cell::RefCell;

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

    fn apply_replacements_with_test_context(
        text: &str,
        replacements: &[Replacement],
        run_command: &dyn Fn(&str) -> bool,
    ) -> String {
        let context = ReplacementContext {
            current_date: "2026-08-11",
            current_time: "10:40",
            run_command,
        };
        apply_replacements_with_context(text, replacements, &context)
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
    fn regex_validation_uses_the_replacement_engine_syntax() {
        assert!(validate_replacement_regex(r"(?i)hello\s+world").is_ok());
        assert!(validate_replacement_regex("[").is_err());
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

    #[test]
    fn date_and_time_tags_insert_context_values() {
        let replacements = [literal_replacement("timestamp", "[date] at [time]")];
        assert_eq!(
            apply_replacements_with_test_context("timestamp", &replacements, &|_| false),
            "2026-08-11 at 10:40"
        );
    }

    #[test]
    fn casing_transformations_run_in_textual_order() {
        let lowercase_last = [literal_replacement("trigger ", "[uppercase][lowercase]")];
        let uppercase_last = [literal_replacement("trigger ", "[lowercase][uppercase]")];
        assert_eq!(
            apply_replacements_with_test_context("trigger Mixed", &lowercase_last, &|_| false),
            "mixed"
        );
        assert_eq!(
            apply_replacements_with_test_context("trigger Mixed", &uppercase_last, &|_| false),
            "MIXED"
        );
    }

    #[test]
    fn lowcase_alias_matches_lowercase_transformation() {
        let replacements = [literal_replacement("trigger ", "[lowcase]")];
        assert_eq!(
            apply_replacements_with_test_context("trigger MIXED", &replacements, &|_| false),
            "mixed"
        );
    }

    #[test]
    fn capitalize_and_nospace_transform_the_entire_result() {
        let replacements = [literal_replacement("trigger ", "[capitalize][nospace]")];
        assert_eq!(
            apply_replacements_with_test_context(
                "trigger hello-world again",
                &replacements,
                &|_| false,
            ),
            "Hello-WorldAgain"
        );
    }

    #[test]
    fn failed_run_uses_text_at_its_ordered_position_and_preserves_output() {
        let commands = RefCell::new(Vec::new());
        let run_command = |command: &str| {
            commands.borrow_mut().push(command.to_string());
            false
        };
        let replacements = [literal_replacement(
            "trigger ",
            concat!(
                "[uppercase]",
                "[run]'cmd::{text}|{text_nospace}|{text_nopunctuation}|",
                "{text_nospace_nopunctuation}'",
                "[lowercase]"
            ),
        )];
        let output = apply_replacements_with_test_context(
            "trigger Hello, world!",
            &replacements,
            &run_command,
        );
        assert_eq!(output, "hello, world!");
        assert_eq!(
            commands.into_inner(),
            ["cmd::HELLO, WORLD!|HELLO,WORLD!|HELLO WORLD|HELLOWORLD"]
        );
    }

    #[test]
    fn successful_run_suppresses_output() {
        let commands = RefCell::new(Vec::new());
        let run_command = |command: &str| {
            commands.borrow_mut().push(command.to_string());
            true
        };
        let replacements = [literal_replacement("trigger ", "[run]\"notify {text}\"")];
        let output =
            apply_replacements_with_test_context("trigger hello", &replacements, &run_command);
        assert!(output.is_empty());
        assert_eq!(commands.into_inner(), ["notify hello"]);
    }

    #[test]
    fn run_is_not_attempted_when_its_replacement_does_not_match() {
        let commands = RefCell::new(Vec::new());
        let run_command = |command: &str| {
            commands.borrow_mut().push(command.to_string());
            true
        };
        let replacements = [literal_replacement("missing", "[run]'notify {text}'")];
        let output = apply_replacements_with_test_context("keep me", &replacements, &run_command);
        assert_eq!(output, "keep me");
        assert!(commands.into_inner().is_empty());
    }

    #[test]
    fn malformed_and_unknown_magic_tags_remain_literal() {
        let replacements = [literal_replacement(
            "trigger",
            "[run]\"unterminated [unknown]",
        )];
        assert_eq!(
            apply_replacements_with_test_context("trigger", &replacements, &|_| true),
            "[run]\"unterminated [unknown]"
        );
    }

    #[test]
    fn empty_run_commands_remain_literal_and_are_not_executed() {
        let commands = RefCell::new(Vec::new());
        let run_command = |command: &str| {
            commands.borrow_mut().push(command.to_string());
            true
        };
        let replacements = [literal_replacement("trigger", "[run]\"\"")];
        let output = apply_replacements_with_test_context("trigger", &replacements, &run_command);
        assert_eq!(output, "[run]\"\"");
        assert!(commands.into_inner().is_empty());
    }
}
