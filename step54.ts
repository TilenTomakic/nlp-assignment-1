import { DataInterface, normalizeOptions } from "./step50";
import * as fs                             from "fs-extra";
import * as natural                        from "natural";
import * as sw                             from 'stopword';
import * as serialize                      from 'serialization';
import { intersection, uniq, union, without, difference }                            from 'lodash';

interface CResult {
    classes: string[];
    scores: {[k: string]: number};
    explanation: {
        positive: {[k: string]: [string, string]};
        negative: {[k: string]: [string, string]};
    };
}

function newClassifierFunction() {
    const limdu    = require('limdu');
    const MyWinnow = limdu.classifiers.Winnow.bind(0, { retrain_count: 10 });

    // Initialize a classifier with a feature extractor:
    return new limdu.classifiers.multilabel.BinaryRelevance({
        binaryClassifierType: MyWinnow
    });
}

(natural.PorterStemmer as any).attach();
const compromise = require('compromise');

function tokensToInput(tokens: string[]) {
    return tokens.reduce((a, token) => {
        if (token) {
            a[ token ] = 1;
        }
        return a;
    }, {})
}

function textToInput(txt: string) {
    const tokens = sw.removeStopwords(compromise(txt).normalize(normalizeOptions).out('text').tokenizeAndStem());
    return tokensToInput(tokens);
}

function classify(intentClassifier, txt, level = 1) {
    return intentClassifier.classify(textToInput(txt), level);
}

export async function step54() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    const limduClassifierSavedString = await fs.readFile('./data/limdu_classifier');
    const useSavedClassifierSaved = !true;

    let intentClassifier;
    if (useSavedClassifierSaved) {
        intentClassifier = serialize.fromString(limduClassifierSavedString, __dirname);
    } else {
        intentClassifier = newClassifierFunction();
        const inputs = [];
        data.items
            //.slice(0, 100)
            .forEach(page => {
                let output = page.tags;
                output.push(page.id);
                //const allDocTokens = page.documents
                //    .filter(doc => !doc.rejected)
                //    .filter(doc => doc.tokens.length > 3)
                //    .sort((a, b) => b.measure - a.measure)
                //    .slice(0, 1)
                //    .map(doc => doc.tokens)
                //    .reduce((a, c) => [...a, ...c], []);
                // inputs.push({ input: tokensToInput(uniq([...page.descriptionTokens, ...allDocTokens])), output });

                inputs.push({ input: tokensToInput(page.descriptionTokens), output });
                page.documents
                    .filter(doc => !doc.rejected)
                    .filter(doc => doc.tokens.length > 3)
                    .sort((a, b) => b.measure - a.measure)
                    .slice(0, 10)
                    .forEach(doc => {
                        inputs.push({
                            input: tokensToInput(
                                doc.tokens
                                    .splice(0, 10)
                            ), output
                        });
                    })
            });

        intentClassifier.trainBatch(inputs);
        const limduClassifierExportString = serialize.toString(intentClassifier, newClassifierFunction);
        await fs.writeFile('./data/limdu_classifier', limduClassifierExportString);
    }

    const a = classify(intentClassifier, 'did the tests pass?', 4);
    const b = classify(intentClassifier, 'GraphDB is a RDF graph database or triplestore. It is the only triplestore that can perform semantic inferencing at scale allowing users to create new semantic facts from existing facts. It also has the ability to visualize triples.', 4);
    const c = classify(intentClassifier, 'create a website', 4);

    const results = data.testItems.map(p => {
        const expectedTags = [...p.tags, ...p.alternatives];
        const result: CResult = intentClassifier.classify(tokensToInput(p.descriptionTokens), 4);

        const found = intersection(result.classes, expectedTags);
        const diff =  difference(result.classes, expectedTags);
        const missed = without(expectedTags, ...found);
        const wrong = without(result.classes, ...expectedTags);

        return { testId: p.id, expectedTags, result, found, diff, missed, wrong }
    });

    let found  = 0;
    let missed = 0;
    let wrong  = 0;
    results.forEach(x => {
        found += x.found.length;
        missed += x.missed.length;
        wrong += x.wrong.length;
    });

    console.log({
        found,
        missed,
        wrong
    });
}
