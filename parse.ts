import xpath from 'npm:xpath';
import { DOMParser } from 'npm:@xmldom/xmldom';
import * as cheerio from 'npm:cheerio';
import parse from "https://deno.land/x/date_fns@v2.22.1/parse/index.js";
import { et } from "https://deno.land/x/date_fns@v2.22.1/locale/index.js";

interface IResult {
    lastUpdated: Date;
    total: number;
    aircraft: IAircraft[];
}

interface IAircraft {
    registration: string;
    type: string;
    serialNumber: string;
    owner: string;
    operator: string;
    lastSeen: Date;
}

const html = await Deno.readTextFile('./data.html');

// we first parse with cheerio in XML mode (which uses htmlparser2 under the hood)
// so that we forgive some of the errors in the html
const cheerioDoc = cheerio.load(html);
const cheerioHtml = cheerioDoc.html({ xml: true});

// now we parse the html with the xmldom parser so we can hand it to xpath
const doc = new DOMParser().parseFromString(cheerioHtml, 'text/xml');

// the Document from DOMParser is actually a Node, so we can use it with xpath
const table = xpath.select1('.//table[ contains( ., "updated" ) ]', doc as unknown as Node) as Node;

// get the last updated date
const updatedDateCell = xpath.select1('.//td[ contains( ., "updated" ) ]', table) as Node;
const updatedDateContent = updatedDateCell.textContent?.trim() ?? '';

// some crazy parsing to get just the date
const updatedDate = updatedDateContent.split(':').map((c) => c.trim()).map((c) => c.split(/\s/));
console.log('updated: ', updatedDate[1][0]);

// the total doesn't appear to be accurate
// get the total number of aircraft
// const totalCell = xpath.select('.//td[ contains( ., "total" ) ]', (table as Node));
// const totalContent = (totalCell[0] as Node).toString();

// console.log('total', totalContent);

// get all but the first two rows, which contain our actual data
const rows = xpath.select('.//tr[ position() > 2 ]', table) as Node[];

console.log('number of rows', rows.length);

const aircraft: IAircraft[] = []
for (const row of rows) {
    // there are blank lines. if the registration is blank, skip this ling
    if (xpath.select1('.//td[1]', row) == null) {
        continue;
    }

    const registration = (xpath.select1('.//td[2]', row) as Node).textContent!.trim();
    const type = (xpath.select1('.//td[5]', row) as Node).textContent!.trim();
    const serialNumber = (xpath.select1('.//td[6]', row) as Node).textContent!.trim();
    const owner = (xpath.select1('.//td[7]', row) as Node).textContent!.trim();
    const operator = (xpath.select1('.//td[8]', row) as Node).textContent!.trim();

    aircraft.push({
        registration,
        type,
        serialNumber,
        owner,
        operator,
        lastSeen: new Date(),
    });
}

console.log('number of aircraft', aircraft.length);

const updatedAt = parse(updatedDate[1][0], 'dd.MM.yyyy', new Date(), { locale: et });

const result: IResult = {
    lastUpdated: updatedAt,
    total: aircraft.length,
    aircraft: aircraft,
};

await Deno.writeTextFile('./data.json', JSON.stringify(result, null, 2));