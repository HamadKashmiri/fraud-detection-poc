const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

function getRandomFraudResponse() {
    const fraudTypes = [
        'other', 'handwritten characters', 'digital tampering', 'generated document',
        'LCD photo', 'screenshot', 'not a document', 'duplicate', 'high velocity',
        'fraudulent pdf', 'critical velocity', 'similar documents', 'multiple profiles or devices',
        'fraud history', 'emulated device', 'blocked device'
    ];
    const warningTypes = [
        'tax_rate_missmatch', 'item_counts_missmatch', 'totals_missmatch', 'line_item_amount_missmatch',
        'line_item_repeats', 'barcode_decoding_issue', 'barcode_code_missing_in_ocr',
        'logo_vendor_missmatch', 'malware'
    ];

    const score = Math.random();
    let color = 'green';
    if (score > 0.7) color = 'red';
    else if (score > 0.3) color = 'yellow';

    // Sample fraud warnings with realistic messages
    const warnings = [
        {
            type: 'tax_rate_missmatch',
            message: 'The tax rate on the document does not match the expected rate for this jurisdiction.'
        },
        {
            type: 'item_counts_missmatch',
            message: 'The total item count does not match the number of items listed in the invoice.'
        },
        {
            type: 'line_item_amount_missmatch',
            message: 'The amount for line item 2 does not align with the total cost of the product.'
        },
        {
            type: 'logo_vendor_missmatch',
            message: 'The logo on the document does not match the official vendor logo in the database.'
        }
    ];

    return {
        fraud: {
            attribution: "Automated Fraud Detection",
            decision: "Randomly Generated Decision",
            color,
            pages: [{
                is_lcd: {
                    score: Math.random(),
                    value: Math.random() > 0.5
                }
            }],
            images: [{
                is_lcd: Math.random() > 0.5,
                score: Math.random()
            }],
            score,
            version: "1.0.0",
            submissions: {
                "device_123": Math.floor(Math.random() * 10)
            },
            fraudulent_pdf: {
                "pdf_anomaly": Math.random()
            },
            types: [fraudTypes[Math.floor(Math.random() * fraudTypes.length)]],
            fraud_review: {
                decision: ["fraud", "not fraud", "unknown"][Math.floor(Math.random() * 3)],
                types: [fraudTypes[Math.floor(Math.random() * fraudTypes.length)]]
            },
            warnings: warnings
        }
    };
}


async function verifyDocument(filePath) {
    let verificationResult;
    if (!process.env.VERYFI_CLIENT_ID || !process.env.VERYFI_USERNAME || !process.env.VERYFI_API_KEY) {
        verificationResult = {};
    } else {
        try {
            const fileData = fs.readFileSync(filePath, { encoding: 'base64' });

            const response = await axios.post('https://api.veryfi.com/api/v8/partner/documents', {
                file_data: fileData
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'CLIENT-ID': process.env.VERYFI_CLIENT_ID,
                    'AUTHORIZATION': `apikey ${process.env.VERYFI_USERNAME}:${process.env.VERYFI_API_KEY}`
                }
            });
            verificationResult = response.data;
        } catch (error) {
            console.error('Veryfi API error:', error.response?.data || error.message);
            verificationResult = {};
        }
    }
    return { ...verificationResult, ...getRandomFraudResponse() };
}

app.post('/upload', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = `./uploads/${req.file.filename}`;
    const verificationResult = await verifyDocument(filePath);

    res.json({ message: 'File uploaded successfully', filename: req.file.filename, verificationResult });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});