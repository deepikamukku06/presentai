import spacy

nlp = spacy.load("en_core_web_sm")

# soft list — used only as hints, not hard rules
CANDIDATE_FILLERS = {
    "like",
    "actually",
    "basically",
    "so",
    "well",
    "um",
    "uh",
    "ah",
    "er",
    "okay",
    "right",
    "literally",
}

PHRASE_FILLERS = {
    "you know",
    "i mean",
    "sort of",
    "kind of",
}


def is_discourse_like(token):
    """
    Returns True if token is being used as a filler/discourse marker,
    not as syntactic content.
    """

    # Interjections are classic fillers
    if token.pos_ == "INTJ":
        return True

    # Sentence-initial hedge words
    if token.i == token.sent.start and token.dep_ in {
        "discourse",
        "advmod",
        "intj",
    }:
        return True

    # Detached adverbs
    if token.dep_ in {"discourse", "intj"}:
        return True

    # "like" only when NOT a verb or preposition
    if token.text.lower() == "like":
        return token.pos_ in {"INTJ", "ADV"}

    # Hedge adverbs not modifying verbs/nouns
    if token.text.lower() in CANDIDATE_FILLERS:
        if token.dep_ in {"advmod", "discourse"}:
            return True

    return False


def detect_phrase_fillers(doc):

    results = []

    lowered = [t.text.lower() for t in doc]

    for phrase in PHRASE_FILLERS:

        parts = phrase.split()

        for i in range(len(lowered) - len(parts) + 1):

            if lowered[i : i + len(parts)] == parts:

                results.append(i)

    return results


def detect_fillers_from_text(text, timestamp):

    doc = nlp(text)

    results = []

    phrase_starts = detect_phrase_fillers(doc)

    used = set()

    # phrase fillers first
    for i in phrase_starts:

        span = doc[i : i + 2]

        results.append(
            {
                "word": span.text,
                "time": timestamp,
            }
        )

        for t in span:
            used.add(t.i)

    # single-token fillers
    for token in doc:

        if token.i in used:
            continue

        if is_discourse_like(token):

            results.append(
                {
                    "word": token.text,
                    "time": timestamp,
                }
            )

    return results
