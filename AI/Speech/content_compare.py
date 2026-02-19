import spacy

nlp = spacy.load("en_core_web_sm")

def extract_points(text):

    doc = nlp(text)

    return [s.text.strip() for s in doc.sents if len(s.text.split()) > 6]


def compare_to_reference(spoken, reference):

    spoken_doc = nlp(spoken.lower())
    ref_points = extract_points(reference)

    missed = []

    for p in ref_points:

        p_words = {t.lemma_.lower() for t in nlp(p)}

        found = False

        for s in spoken_doc.sents:

            s_words = {t.lemma_.lower() for t in s}

            overlap = len(p_words & s_words)

            if overlap >= max(2, len(p_words) * 0.4):
                found = True
                break

        if not found:
            missed.append(p)

    return missed
