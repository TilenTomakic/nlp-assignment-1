import { DataInterface, normalizeOptions }                from "./step50";
import * as fs                                            from "fs-extra";
import * as natural                                       from "natural";
import * as sw                                            from 'stopword';
import * as serialize                                     from 'serialization';
import { intersection, uniq, union, without, difference } from 'lodash';
import { TestData }                                       from "./test";

interface CResult {
    classes: string[];
    explanation: any;
}

function classifierWinnow() {
    const limdu    = require('limdu');
    const MyWinnow = limdu.classifiers.Winnow.bind(0, { retrain_count: 10 });
    return new limdu.classifiers.multilabel.BinaryRelevance({
        binaryClassifierType: MyWinnow
    });
}

function classifierAdaboost() {
    const limdu = require('limdu');
    return new limdu.classifiers.multilabel.Adaboost({});
}

function classifierPassiveAggressive() {
    const limdu         = require('limdu');
    const retrain_count = 10;
    return new limdu.classifiers.multilabel.PassiveAggressive({
        Constant: 5.0,
        retrain_count,
    });
}

function classifierThresholdPassiveAggressive() {
    const limdu = require('limdu');
    const F1_evaluation = function(stats, type_of_averaging) {
        if (type_of_averaging == 0) {
            if ((stats[ 'TP' ] == 0) || (stats[ 'TP' ] + stats[ 'FP' ] == 0) || (stats[ 'TP' ] + stats[ 'FN' ] == 0)) return 0

            var precision = stats[ 'TP' ] / (stats[ 'TP' ] + stats[ 'FP' ])
            var recall    = stats[ 'TP' ] / (stats[ 'TP' ] + stats[ 'FN' ])

            var f1 = (precision * recall) / (precision + recall)
            return f1
        }
    };
    const classifier                 = limdu.classifiers.multilabel.PassiveAggressive.bind(0, {
        Constant     : 1.0,
        retrain_count: 10,
    });
    const ThresholdPassiveAggressive = limdu.classifiers.multilabel.ThresholdClassifier.bind(0, {
        multiclassClassifierType         : classifier,
        devsetsize                       : 10,  // validationset equal to trainset
        evaluateMeasureToMaximize        : F1_evaluation,
        numOfFoldsForThresholdCalculation: 1
    });
    return new ThresholdPassiveAggressive();
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

export async function step62() {
    const data: DataInterface     = await fs.readJson('./data/data.json');
    const classifierFile          = './data/limdu_classifier_PassiveAggressive_10';
    const useSavedClassifierSaved = !true;
    const classifierFun           = classifierWinnow;

    const testData = new TestData();
    await testData.initTest();

    let intentClassifier;
    if (useSavedClassifierSaved) {
        console.log('Training pre-loaded.');
        const limduClassifierSavedString = await fs.readFile(classifierFile);
        intentClassifier                 = serialize.fromString(limduClassifierSavedString, __dirname);
    } else {
        console.log('Training started.');
        intentClassifier = classifierFun();
        const inputs     = [];
        data.items
            .forEach(page => {
                // let output = page.tags;
                // output.push(`PRODUCT:${page.id}`);
                let output = page.alternatives;
                output.push(`${page.id}`);

                // inputs.push({ input: tokensToInput(page.descriptionTokens), output });
                inputs.push({
                    input: tokensToInput(
                        page.tokens
                    ), output
                });
            });

        intentClassifier.trainBatch(inputs);
        const limduClassifierExportString = serialize.toString(intentClassifier, classifierFun);
        await fs.writeFile(classifierFile, limduClassifierExportString);
        console.log('Training done.');
    }

    // mini manual test
    const a = classify(intentClassifier, 'did the tests pass?', 4);
    const b = classify(intentClassifier, 'GraphDB is a RDF graph database or triplestore. It is the only triplestore that can perform semantic inferencing at scale allowing users to create new semantic facts from existing facts. It also has the ability to visualize triples.', 4);
    const c = classify(intentClassifier, 'create a website', 4);
    const d = classify(intentClassifier, 'VirMach specializes in providing extremely affordable VPS services for many applications and with various different specifications, located in multiple reliable datacenters. We offer cheap Windows VPS plans as well as some of the cheapest Linux plans and dedicated servers, without sacrificing great support and uptime. Get started by comparing services, testing our network, or contact us.');

    await testData.test(classifierFun.name, (pageId: string, tokens: string[], vectors: number[], terms: { [ token: string ]: number }) => {
        const result: CResult = intentClassifier.classify(terms, 4);
        return result.classes;
    });
}
