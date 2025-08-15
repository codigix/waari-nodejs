const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const db = require('knex')({

client: 'mysql',
connection: {
    host: '127.0.0.1',
    user: 'your_user',
    password: 'your_password',
    database: 'your_database'
}
});

class GeneratePdf {
constructor(data) {
    this.data = data;
}

async handle() {
    try {
        const tourName = this.data.grouptoursdata.tourName;

        // Generate predeparture PDF
        const predepartureFilename = `${tourName}_predeparture_${Date.now()}.pdf`;
        const predeparturePath = path.join(__dirname, '../../public/predeparture', predepartureFilename);

        const predepartureDoc = new PDFDocument();
        predepartureDoc.pipe(fs.createWriteStream(predeparturePath));
        predepartureDoc.text('Predeparture Content'); // Add your content here
        predepartureDoc.end();

        const predepartureUrl = `public/predeparture/${predepartureFilename}`;

        // Update the database
        const groupTourId = this.data.grouptoursdata.groupTourId;

        await db('grouptours')
            .where('groupTourId', groupTourId)
            .update({
                predepartureUrl: predepartureUrl
            });

    } catch (error) {
        console.error('Error generating PDF:', error.message);
    }
}
}

module.exports = GeneratePdf;