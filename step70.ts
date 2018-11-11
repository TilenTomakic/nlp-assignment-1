import * as rp                               from 'request-promise-native';
import * as cheerio                          from 'cheerio';
import * as fs                               from 'fs-extra';
import { chunk }                             from 'lodash';
import { ItemInterface, IndexPageInterface } from "./step1";
import * as Crawler                          from "crawler";
import { PageInterface }                     from "./step2";
import * as unfluff                          from 'unfluff';
import { DataInterface }                     from "./step50";

const WikiJS     = require('wikijs').default;
const striptags  = require('striptags');
const compromise = require('compromise');
const jsdom      = require("jsdom");
const { JSDOM }  = jsdom;

export async function step70() {
    //const data = await fs.readJson('./data/reportMIN.json');
    const data  = await fs.readJson('./data/reportMIN_min.json');
    const sizes = Object.keys(data);
    const types = Object.keys(data[ sizes[ 0 ] ]);

    const table = `<table>
	<tbody>
		<tr>
			<th></th>
			${ sizes.map(x => `<th colspan="2">${ x }</th>`) }
		</tr>
		<tr>
		    <th>Povprečje</th>
		    ${ sizes.map(x => `<th>Najdenih</th><th>Napačnih</th>`) }
		</tr>
		${ types.map(type =>
        `<tr>
			<th>${ type }</th>
			${ sizes.map(size => `<td>${ data[ size ][ type ].avgFoundRate }</td><td>${ data[ size ][ type ].avgWrong }</td>`) }
		</tr>`
    ) }
	</tbody>
</table>`;

    await fs.writeFile('./data/out70.html', `<html><heah>
<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic">
<link rel="stylesheet" href="//cdn.rawgit.com/necolas/normalize.css/master/normalize.css">
<link rel="stylesheet" href="//cdn.rawgit.com/milligram/milligram/master/dist/milligram.min.css">
</heah><body>
<div style="margin: 1em"><h1>FRI ONJ - assignment 1 - tablest</h1><hr>${ table }</div>
</body></html>`);
}