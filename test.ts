import { DataInterface }                                  from "./step50";
import * as fs                                            from "fs-extra";
import { docsNum, VecDocumnets }                          from "./step51";
import { intersection, uniq, union, without, difference } from 'lodash';

export class TestData {

    data: DataInterface;
    vectorDocs: VecDocumnets[];
    vectors: number[][];
    tagVectors: number[][];
    testVectorDocs: VecDocumnets[];
    testVectors: number[][];
    allVectors: number[][];

    knownAltenatives: string [];

    constructor() {

    }

    async initTest() {
        this.data       = await fs.readJson('./data/data.json');
        this.vectorDocs = await fs.readJson('./data/vectors.json');
        this.vectors    = this.vectorDocs.map(x => x.vectors);
        this.tagVectors = this.data.items.map(x => x.tagsVectors);

        this.testVectorDocs = await fs.readJson('./data/testVectors.json');
        this.testVectors    = this.vectorDocs.map(x => x.vectors);
        this.allVectors     = [ ...this.vectors, ...this.testVectors ];
    }

    async test(testName: string, classify: (pageId: string, tokens: string[], vectors: number[], terms: { [ token: string ]: number } ) => string[]) {
        this.knownAltenatives = this.data.items.map(page => page.id);
        const results         = this.data.testItems.map((p, i) => {
            const expectedTags = [ ...p.alternatives.filter(x => this.knownAltenatives.indexOf(x) !== -1) ];
            const classes      = classify(p.id, p.tokens, this.testVectors[ i ], p.terms);

            const found  = intersection(classes, expectedTags);
            const diff   = difference(classes, expectedTags);
            const missed = without(expectedTags, ...found);
            const wrong  = without(classes, ...expectedTags);

            return { testId: p.id, expectedTags, classes, found, diff, missed, wrong }
        });

        let found  = 0;
        let missed = 0;
        let wrong  = 0;
        results.forEach(x => {
            found += x.found.length;
            missed += x.missed.length;
            wrong += x.wrong.length;
        });
        let avgFoundRate  =found / results.length;
        let avgWrong  = wrong / results.length;

        console.log("*** TEST REPORT: " + testName);
        console.log({
            found,
            missed,
            wrong,
            avgFoundRate,
            avgWrong
        });

        let report: any = {};
        if (fs.existsSync('./data/report.json')) {
            report = await fs.readJson('./data/report.json');
        }
        let reportMin: any = {};
        if (fs.existsSync('./data/reportMIN.json')) {
            reportMin = await fs.readJson('./data/reportMIN.json');
        }
        report[testName] = {
            found,
            missed,
            wrong,
            avgFoundRate,
            avgWrong,
            results
        };


        reportMin[docsNum] = reportMin[docsNum] || {};
        reportMin[docsNum][testName] = {
            found,
            missed,
            wrong,
            avgFoundRate,
            avgWrong
        };
        await fs.writeJson('./data/reportMIN.json', reportMin);
    }
}
