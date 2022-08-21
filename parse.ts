import { DOMParser } from 'https://cdn.skypack.dev/@xmldom/xmldom?dts';
import * as xpath from 'https://cdn.skypack.dev/xpath?dts';
import { parse } from 'https://cdn.skypack.dev/date-fns';

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

(async () => {
    const html = await Deno.readTextFile('./data.html');
    const doc = new DOMParser().parseFromString(html);

    const table = xpath.select('.//table[ contains( ., "updated" ) ]', doc)[0] as Node;

    // get the last updated date
    const updatedDateCell = xpath.select('.//td[ contains( ., "updated" ) ]', table)[0] as Node;
    const updatedDateContent = updatedDateCell.toString();

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

        const registration = (xpath.select('.//td[2]', row)[0] as Node).textContent!.trim();
        const type = (xpath.select('.//td[5]', row)[0] as Node).textContent!.trim();
        const serialNumber = (xpath.select('.//td[6]', row)[0] as Node).textContent!.trim();
        const owner = (xpath.select('.//td[7]', row)[0] as Node).textContent!.trim();
        const operator = (xpath.select('.//td[8]', row)[0] as Node).textContent!.trim();

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

    const updatedAt = parse(updatedDate[1][0], 'dd.MM.yyyy', new Date());

    const result: IResult = {
        lastUpdated: updatedAt,
        total: aircraft.length,
        aircraft: aircraft,
    };

    await Deno.writeTextFile('./data.json', JSON.stringify(result, null, 2));
})();