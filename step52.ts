import * as FastText from 'fasttext.js';

const trainOpt = {
    // number of concurrent threads
    thread: 6,
    // verbosity level [2]
    verbose: 4,
    // number of negatives sampled [5]
    neg: 5,
    // loss function {ns, hs, softmax} [ns]
    loss: process.env.TRAIN_LOSS || 'ns',
    // learning rate [0.05]
    lr: process.env.TRAIN_LR || 0.01,
    // change the rate of updates for the learning rate [100]
    lrUpdateRate: 100,
    // max length of word ngram [1]
    wordNgrams: process.env.TRAIN_NGRAM || 1,
    // minimal number of word occurences
    minCount: 1,
    // minimal number of word occurences
    minCountLabel: 1,
    // size of word vectors [100]
    dim: process.env.TRAIN_DIM || 5,
    // size of the context window [5]
    ws: process.env.TRAIN_WS || 5,
    //  number of epochs [5]
    epoch: process.env.TRAIN_EPOCH || 5,
    // number of buckets [2000000]
    bucket: process.env.TRAIN_BUCKET || 300,
    // min length of char ngram [3]
    minn: process.env.TRAIN_MINN || 3,
    // max length of char ngram [6]
    maxn: process.env.TRAIN_MAXN || 6,
    // sampling threshold [0.0001]
    t: 0.0001,
    pretrainedVectors: process.env.WORD2VEC || ''
};

async function train() {
    const fastText = new FastText({
        train: trainOpt,
        serializeTo: './data/model',
        trainFile: './data/train.tsv',
        trainCallback: function (res) {
            console.log("\t" + JSON.stringify(res));
        }
    });
    // const done = await fastText.word2vec();
    const done = await fastText.train();
    return;
}

async function test() {
    const fastText = new FastText({
        loadModel: './data/model.bin',
        testFile: './data/test.tsv'
    });
    const evaluation = await fastText.test();

    console.log('test done');
}

async function manTest() {
    const fastText = new FastText({
        loadModel: './data/model.bin'
    });
    await fastText.load();
    const res = await fastText.predict('GraphDB is a RDF graph database or triplestore. It is the only triplestore that can perform semantic inferencing at scale allowing users to create new semantic facts from existing facts. It also has the ability to visualize triples. ');

    console.log('train & test done');
}

async function manTestNn() {
    const fastText = new FastText({
        loadModel: './data/model.bin'
    });
    await fastText.loadnn();
    const res = await fastText.nn('GraphDB is a RDF graph database or triplestore. It is the only triplestore that can perform semantic inferencing at scale allowing users to create new semantic facts from existing facts. It also has the ability to visualize triples. ');

    console.log('train & test done');
}


export async function step52() {
    await train();
    await test();
    await manTest();
    await manTestNn();
    console.log('train & test done');
}
