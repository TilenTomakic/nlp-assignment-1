import * as FastText from 'fasttext.js';
import {DataInterface, DocumentInterface, normalizeOptions} from "./step50";
import * as fs from "fs-extra";
import * as natural from "natural";

(natural.PorterStemmer as any).attach();
// (natural.LancasterStemmer as any).attach();

const tokenizer = new natural.WordTokenizer();
const wordnet = new natural.WordNet();
const TfIdf = natural.TfIdf;
const compromise = require('compromise');

function classify(classifier: any, txt: string) {
    const norm = (compromise(txt).normalize(normalizeOptions).out('text'));
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
    classifier.save('./data/brain_classifier.json', function () {});

    const xx = classify(classifier, 'did the tests pass?');
    const xx2 = classify(classifier, 'GraphDB is a RDF graph database or triplestore. It is the only triplestore that can perform semantic inferencing at scale allowing users to create new semantic facts from existing facts. It also has the ability to visualize triples.');

    console.log(12);
}
