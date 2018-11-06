import * as fs                                from 'fs-extra';
import * as natural                           from 'natural';
import { DataInterface, PackedPageInterface } from "./step50";

(natural.PorterStemmer as any).attach();
// (natural.LancasterStemmer as any).attach();

const tokenizer = new natural.WordTokenizer();
const wordnet = new natural.WordNet();
const TfIdf = natural.TfIdf;

async function processPage(page: PackedPageInterface) {
    const tfidf = new TfIdf();
    page.descriptionTokens = (page.descriptionNorm as any).tokenizeAndStem();
    page.documents
        .map(x => ({ ...x, tokens: (x.textNorm as any).tokenizeAndStem() }))
        .map(x => tfidf.addDocument(x.tokens));

    // page.tfidf = JSON.stringify(tfidf);

    tfidf.tfidfs(page.descriptionTokens, (i, measure) => {
        page.documents[i].measure = measure;
    });

    const avgScore = page.documents.reduce((a, x) => (a + x.measure) / 2, 0);

    page.documents
        .map(x => x.rejected = x.measure < avgScore * 0.8 && 'tfidfs similarity to low')
}

export async function step51() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    // await processPage(data.items[0]);
    await Promise.all(data.items.map(x => processPage(x)));


    const trainTsv = data.items.reduce((a, x) => {
        x.documents
            .filter(d => !d.rejected)
            .forEach(n => a += `${ x.id }\t${ n.text }\n`);
        a += `${ x.id }\t${ x.description }\n`;
        return a;
    }, '');

    const testTsv = data.items.reduce((a, x) => {
        a += `${ x.alternatives[0] }\t${ x.description }\n`;
        return a;
    }, '');

    await fs.writeJson('./data/data.json', data);

    await fs.writeFile('./data/train.tsv', trainTsv);
    await fs.writeFile('./data/test.tsv', testTsv);
}
