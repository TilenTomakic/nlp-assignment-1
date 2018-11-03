import * as rp                               from 'request-promise-native';
import * as cheerio                          from 'cheerio';
import * as fs                               from 'fs-extra';
import { chunk }                             from 'lodash';
import { ItemInterface, IndexPageInterface } from "./step1";
import * as Crawler                          from "crawler";
import { PageInterface }                     from "./step2";
import * as unfluff                          from 'unfluff';

const version = 3;

const crawler = new Crawler({
    maxConnections: 10,
    // rotateUA: true,
    // userAgent: [],
    callback      : function (error, res, done) {
        if (error) {
            const page      = res.options.params.page;
            page.skip       = true;
            page.skipReason = error.message;
            fs.writeJson(page.file, page).then(() => {
                done();
            }).catch((e) => {
                console.error(e, res.options.params);
                done();
            });
        } else {
            processData(res, res.$, res.options.params)
                .then(() => done())
                .catch((e) => {
                    console.error(e, res.options.params);
                    done();
                });
        }
    }
});

async function processData(res, $: CheerioStatic, { page }: { page: PageInterface }) {
    process.stdout.write(", " + page.item.id + `(${ page.officalUrl })`);
    page.officalHtml  = res.body;
    page.officalPage  = unfluff(res.body, 'en');
    page.versionStep3 = version;
    await fs.writeJson(page.file, page);
}

export async function step3() {
    const pages = fs.readdirSync('./data/pages');
    for (const pageName of pages) {
        const page: PageInterface = await fs.readJson(`./data/pages/${ pageName }`);
        if (page.versionStep3 === version) {
            continue;
        }
        const params = {
            page
        };
        if (page.officalHtml) {
            crawler.queue({
                html: page.officalHtml,
                params
            });
        } else {
            if (page.officalUrl) {
                crawler.queue({
                    uri: page.officalUrl,
                    params
                });
            } else {
                page.skip = true;
                await fs.writeJson(page.file, page);
            }
        }
    }

    if (crawler.queueSize > 0) {
        return new Promise(resolve => {
            crawler.on('drain', function () {
                resolve();
            });
        })
    }
}