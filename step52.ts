import * as FastText from 'fasttext.js';

export async function step52() {
    const fastText = new FastText({
        serializeTo: './data/model',
        trainFile: './data/train.tsv',
        trainCallback: function(res) {
            console.log( "\t"+JSON.stringify(res) );
        }
    });
    const done = await fastText.train();

    const a = await fastText.predict('create a blog website, write posts');

    console.log();
}
