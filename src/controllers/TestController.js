// src/controllers/TestController.js
const path = require('path');
const pdf = require('html-pdf');

class TestController {
    constructor() {
        this.maxExecutionTime = 300000; // 5 minutes
    }

    // Render predeparture page
    testPredeparture(req, res) {
        res.render('predeparture');
    }

    // Generate PDF for predeparture
    generatePredeparture(req, res) {
        const options = { format: 'Letter' };

        res.render('predeparture', {}, (err, html) => {
            if (err) return res.status(500).send('Error generating PDF');

            pdf.create(html, options).toBuffer((err, buffer) => {
                if (err) return res.status(500).send('Error generating PDF');

                res.setHeader('Content-Disposition', 'attachment; filename=waaripredeparture.pdf');
                res.setHeader('Content-Type', 'application/pdf');
                res.send(buffer);
            });
        });
    }

    // Render print page
    testPrint(req, res) {
        res.render('print');
    }

    // Generate PDF for print
    generatePrint(req, res) {
        const options = { format: 'Letter' };

        res.render('print', {}, (err, html) => {
            if (err) return res.status(500).send('Error generating PDF');

            pdf.create(html, options).toBuffer((err, buffer) => {
                if (err) return res.status(500).send('Error generating PDF');

                res.setHeader('Content-Disposition', 'attachment; filename=print.pdf');
                res.setHeader('Content-Type', 'application/pdf');
                res.send(buffer);
            });
        });
    }
}

module.exports = new TestController();
