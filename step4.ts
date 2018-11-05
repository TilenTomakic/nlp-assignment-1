import * as rp from 'request-promise-native';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import {chunk} from 'lodash';
import {ItemInterface, IndexPageInterface} from "./step1";
import * as Crawler from "crawler";
import {PageInterface} from "./step2";
import * as unfluff from 'unfluff';
const WikiJS = require('wikijs').default;

const version = 4;

export async function step4() {
    const pages = fs.readdirSync('./data/pages');
    let i = 0;
    let ok = [];
    let fail = [];
    for (const pageName of pages) {
        const page: PageInterface = await fs.readJson(`./data/pages/${ pageName }`);
        if (!page.officalHtml || page.skip) {
            continue;
        }
        i++;

        if (page.wiki) {
            ok.push(page.item.title);
        } else {
            fail.push(page.item.title);
        }

        if (page.versionStep4 === version) {
            continue;
        }

        try {
            const wiki = await WikiJS().page(page.item.title)
                .then(page => Promise.all([page.fullInfo(), page.content()]));
            page.wiki = {
                content: wiki[1],
                fullInfo: wiki[0]
            };
        } catch (e) {
            page.wikiSkip = true;
            if (e.message !== 'No article found') {
                console.error(e);
            }
        }
        page.versionStep4 = version;
        process.stdout.write(", " + page.item.title);
        await fs.writeJson(page.file, page);
    }

    console.log('WIKI: ok -> ' + ok.length + ', fail: ' + fail.length);
}
