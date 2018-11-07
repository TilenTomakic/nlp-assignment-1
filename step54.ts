import { DataInterface, normalizeOptions } from "./step50";
import * as fs                             from "fs-extra";
import * as natural                        from "natural";
import * as sw                             from 'stopword';

(natural.PorterStemmer as any).attach();
const compromise = require('compromise');


function classify(classifier: any, txt: string) {
    const norm = sw.removeStopwords(compromise(txt).normalize(normalizeOptions).out('text').split(' ')).join(' ');
    return classifier.classify(norm.tokenizeAndStem().join(' '));
}

export async function step54() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    const classifier = new natural.BayesClassifier();

    data.items.map(page => {
        classifier.addDocument(page.descriptionTokens.join(' '), page.id);
        // page.documents.map(doc => classifier.addDocument(doc.tokens.join(' '), page.id))
        page.sentences.map(doc => classifier.addDocument(doc.tokens.join(' '), page.id))
    });

    classifier.train();
    await new Promise((resolve, fail) => {
        classifier.save('./data/classifier_NaiveBayes.json', function (err, classifier) {
            if (err) {
                return fail();
            }
            resolve();
        });
    });

    const a = classify(classifier, 'did the tests pass?');
    const b = classify(classifier, 'GraphDB is a RDF graph database or triplestore. It is the only triplestore that can perform semantic inferencing at scale allowing users to create new semantic facts from existing facts. It also has the ability to visualize triples.');

    console.log();
}
