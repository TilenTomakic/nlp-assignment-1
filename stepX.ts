import * as rp from 'request-promise-native';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import {chunk} from 'lodash';
import {ItemInterface, IndexPageInterface} from "./step1";
import * as Crawler from "crawler";
import {PageInterface} from "./step2";
import * as unfluff from 'unfluff';
const WikiJS = require('wikijs').default;
const striptags = require('striptags');
const compromise = require('compromise');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;



function printHtml(html){
    const dom = new JSDOM(html);
    const $ = (require('jquery'))(dom.window);
    //    sentences[i].style='display:block;'
    $('span > span').each((i, x) => {
        const tags = x.className.split(' ').map(c=>c.replace(/^nl-/,' '));
        $(x).addClass('term');
        x.setAttribute('title', tags);
    });
    return $('body').html();
}

export async function stepX() {
    const pages = fs.readdirSync('./data/pages');
    let i = 0;
    const items = [];
    for (const pageName of pages) {
        const page: PageInterface = await fs.readJson(`./data/pages/${ pageName }`);
        if (!page.officalHtml || page.skip || !page.wiki) {
            continue;
        }
        i++;


        if (i > 10) {
            continue;
        }

        const wiki =  striptags(page.wiki.content || '')
        // const wiki =  printHtml(compromise(striptags(page.wiki.content || '')).out('html'));
        const offical =  striptags(page.officalPage.text || '')
        // const offical =  printHtml(compromise(striptags(page.officalPage.text || '')).out('html'));

        items.push(`<section style="margin-bottom: 0.5em">
        <h3>${ striptags(page.item.title) } (<a style="font-size: 80%" href="${ page.officalUrl }">${ page.officalUrl }</a>)</h3>
        <div class="row">
            <div class="column">${ printHtml(compromise(striptags(page.item.description || '')).out('html')) }</div>
            <div class="column">${ printHtml(compromise(striptags(page.officalPage.description || '')).out('html')) }</div>
        </div>
        <div class="row">         
            <pre class="column" style="white-space: pre-wrap; padding: 1em; font-size: 12px; max-height: 200px; overflow-y: auto;">${ wiki }</pre>
            <pre class="column" style="white-space: pre-wrap; padding: 1em; font-size: 12px; max-height: 200px; overflow-y: auto;">${  offical }</pre>
        </div>
</section>
        `)
    }

    await fs.writeFile('./data/out.html', `<html><heah>
<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic">
<link rel="stylesheet" href="//cdn.rawgit.com/necolas/normalize.css/master/normalize.css">
<link rel="stylesheet" href="//cdn.rawgit.com/milligram/milligram/master/dist/milligram.min.css">
<style>
.term { color:grey; cursor:pointer;}
.nl-Person { border-bottom:2px solid #6393b9; }
.nl-Pronoun { border-bottom:2px solid #81acce; }
.nl-Plural { border-bottom:2px solid steelblue; }
.nl-Singular { border-bottom:2px solid lightsteelblue; }
.nl-Verb { border-bottom:2px solid palevioletred; }
.nl-Adverb { border-bottom:2px solid #f39c73; }
.nl-Adjective { border-bottom:2px solid #b3d3c6; }
.nl-Determiner { border-bottom:2px solid #d3c0b3; }
.nl-Preposition { border-bottom:2px solid #9794a8; }
.nl-Conjunction { border-bottom:2px solid #c8c9cf; }
.nl-Value { border-bottom:2px solid palegoldenrod; }
.nl-QuestionWord { border-bottom:2px solid lavender; }
.nl-Acronym { border-bottom:2px solid violet; }
.nl-Possessive { border-bottom:2px solid #7990d6; }
.nl-Noun { border-bottom:2px solid #7990d6; }
.nl-Expression { border-bottom:2px solid #b3d3c6; }
.nl-Negative { border-bottom:2px solid #b4adad; }
</style></heah><body>
<div style="margin: 1em"><h1>FRI ONJ - assignment 1</h1><hr>${ items.join('\n') }</div>
</body></html>`);
}