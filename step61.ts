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

export async function step61() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    let classifier = new natural.BayesClassifier();
    const file = './data/classifier_NaiveBayes.json';
    const load = false;
    if (load) {
        await new Promise((resolve, fail) => {
            natural.BayesClassifier.load(file, null, function (err, loadedClassifier) {
                if (err) {
                    return fail(err);
                }
                classifier = loadedClassifier;
                resolve();
            });
        });
    }

    data.items.map(page => {
        classifier.addDocument(page.tokens, page.id);
    });

    classifier.events.on('trainedWithDocument', function (obj) {
        if (obj.index % 10 === 0) {
            console.log(obj.index + '/' + obj.total);
        }
    });
    classifier.train();
    await new Promise((resolve, fail) => {
        classifier.save(file, function (err, classifier) {
            if (err) {
                return fail();
            }
            resolve();
        });
    });

    const a = classify(classifier, 'did the tests pass?');
    const b = classify(classifier, 'GraphDB is a RDF graph database or triplestore. It is the only triplestore that can perform semantic inferencing at scale allowing users to create new semantic facts from existing facts. It also has the ability to visualize triples.');
    const c = classify(classifier, 'VirMach specializes in providing extremely affordable VPS services for many applications and with various different specifications, located in multiple reliable datacenters. We offer cheap Windows VPS plans as well as some of the cheapest Linux plans and dedicated servers, without sacrificing great support and uptime. Get started by comparing services, testing our network, or contact us.');

    console.log(a, b, '61 DONE');
}
