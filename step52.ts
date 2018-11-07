import * as FastText        from 'fasttext.js';
import { normalizeOptions } from "./step50";
import * as natural         from "natural";
import * as sw              from 'stopword';

(natural.PorterStemmer as any).attach();

const compromise = require('compromise');
const trainOpt = {
    // number of concurrent threads
    thread:            4,
    // verbosity level [2]
    verbose:           4,
    // number of negatives sampled [5]
    neg:               5,
    // loss function {ns, hs, softmax} [ns]
    loss:              process.env.TRAIN_LOSS || 'ns',
    // learning rate [0.05]
    lr:                process.env.TRAIN_LR || 0.05,
    // change the rate of updates for the learning rate [100]
    lrUpdateRate:      100,
    // max length of word ngram [1]
    wordNgrams:        process.env.TRAIN_NGRAM || 1,
    // minimal number of word occurences
    minCount:          1,
    // minimal number of word occurences
    minCountLabel:     1,
    // size of word vectors [100]
    dim:               process.env.TRAIN_DIM || 5,
    // size of the context window [5]
    ws:                process.env.TRAIN_WS || 5,
    //  number of epochs [5]
    epoch:             process.env.TRAIN_EPOCH || 5,
    // number of buckets [2000000]
    bucket:            process.env.TRAIN_BUCKET || 300,
    // min length of char ngram [3]
    minn:              process.env.TRAIN_MINN || 3,
    // max length of char ngram [6]
    maxn:              process.env.TRAIN_MAXN || 6,
    // sampling threshold [0.0001]
    t:                 0.0001,
    pretrainedVectors: process.env.WORD2VEC || ''
};

async function train() {
    const fastText = new FastText({
        train:         trainOpt,
        serializeTo:   './data/model',
        trainFile:     './data/train.tsv',
        trainCallback: function (res) {
            console.log("\t" + JSON.stringify(res));
        }
    });

    const done = await fastText.train();
    console.log('Trained: ', done);
}

async function test() {
    const fastText = new FastText({
        loadModel: './data/model.bin',
        testFile:  './data/test.tsv'
    });

    const evaluation = await fastText.test();
    console.log('Test evaluation:', evaluation);
}


function cleantext(txt: string) {
    return sw.removeStopwords(compromise(txt).normalize(normalizeOptions).out('text').split(' ')).join(' ');
}

async function manualTest() {
    const fastText = new FastText({
        loadModel: './data/model.bin'
    });

    await fastText.load();
    const res = await fastText.predict(cleantext('Online  diagram  and  flowchart  software  that  supports  Microsoft  Visio  import  and  can  work  on  any  operating  system.'));

    console.log('Manual test: ', res);
}

export async function step52() {
    await train();
    await test();
    await manualTest();
}
