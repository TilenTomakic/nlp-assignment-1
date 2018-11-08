import * as fs                                from 'fs-extra';
import * as natural                           from 'natural';
import { DataInterface, PackedPageInterface } from "./step50";
import * as sw                                from 'stopword';

// (natural.LancasterStemmer as any).attach();
(natural.PorterStemmer as any).attach(); // <- Porter se izkaže kot boljši

const tokenizer = new natural.WordTokenizer();
const wordnet   = new natural.WordNet();
const TfIdf     = natural.TfIdf;

async function processPage(page: PackedPageInterface) {
    page.tfidf    = new TfIdf();
    page.tfidfSen = new TfIdf();

    page.descriptionTokens = (page.descriptionNorm as any).tokenizeAndStem();
    page.descriptionTokens = sw.removeStopwords(page.descriptionTokens);

    page.documents = page.documents
        .map(x => ({ ...x, tokens: (x.textNorm as any).tokenizeAndStem() }))
        .map(x => ({ ...x, tokens: sw.removeStopwords(x.tokens) }));

    page.sentences = page.sentences
        .map(x => ({ ...x, tokens: (x.textNorm as any).tokenizeAndStem() }))
        .map(x => ({ ...x, tokens: sw.removeStopwords(x.tokens) }));

    page.documents.map(x => page.tfidf.addDocument(x.tokens));
    page.sentences.map(x => page.tfidfSen.addDocument(x.tokens));

    page.tfidf.tfidfs(page.descriptionTokens, (i, measure) => {
        page.documents[ i ].measure = measure;
    });
    page.tfidfSen.tfidfs(page.descriptionTokens, (i, measure) => {
        page.sentences[ i ].measure = measure;
    });

    page.documents.forEach((doc, docI) => {
        doc.tokensTfidf = doc.tokensTfidf || {};
        doc.tokens.forEach(token =>
            page.tfidf.tfidfs(token, (i, measure) =>
                docI === i && (doc.tokensTfidf[ token ] = measure)
            )
        )
    });

    page.sentences.forEach((doc, docI) => {
        doc.tokensTfidf = doc.tokensTfidf || {};
        doc.tokens.forEach(token =>
            page.tfidfSen.tfidfs(token, (i, measure) =>
                docI === i && (doc.tokensTfidf[ token ] = measure)
            )
        )
    });

    const avgScore    = page.documents.reduce((a, x) => (a + x.measure) / 2, 0);
    const avgScoreSen = page.sentences.reduce((a, x) => (a + x.measure) / 2, 0);

    page.documents
        .map(x => x.rejected = x.measure < avgScore * 0.8 && 'tfidfs similarity to low');

    page.sentences
        .map(x => x.rejected = x.measure < avgScoreSen * 0.8 && 'tfidfs similarity to low');
}

export async function step51() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    await Promise.all(data.items.map(x => processPage(x)));
    await Promise.all(data.testItems.map(x => processPage(x)));

    const trainTsv = data.items.reduce((a, x) => {
        x.documents
            .filter(d => !d.rejected)
            .forEach(n => a += `${ x.id }\t${ n.tokens.join(' ') }\n`);
        a += `${ x.id }\t${ x.descriptionTokens.join(' ') }\n`;
        return a;
    }, '');

    const testTsv = data.items.reduce((a, x) => {
        a += `${ x.alternatives[ 0 ] }\t${ x.descriptionTokens.join(' ') }\n`;
        return a;
    }, '');

    await fs.writeJson('./data/data.json', data);

    await fs.writeFile('./data/train.tsv', trainTsv);
    await fs.writeFile('./data/test.tsv', testTsv);
}
