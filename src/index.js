const { spawnSync } = require('child_process');
const path = require('path');
const util = require('util');
const fsPromises = require('fs').promises;
const exec = util.promisify(require('node:child_process').exec);
const axios = require('axios');

const API_SERVICE_KEY = 'AQVNx34OzTyfXn9B6JX-JWQKIgQaP9Akel0Aa6Rh';
const batchAnalyze = 'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze';

const screenShotFileName = '../screenShot.png';
const screenShotTool = 'gnome-screenshot';
const screenShotFilePath = path.join(__dirname, screenShotFileName);

const getRequestConfig = (content) => {
    const data = {
        analyze_specs: [{
            content,
            features: [{
                type: 'TEXT_DETECTION',
                text_detection_config: {
                    language_codes: ["*"]
                }
            }]
        }]
    }

    const requestConfig = {
        method: 'POST',
        url: batchAnalyze,
        headers: {
            'Authorization': `Api-Key ${API_SERVICE_KEY }`,
            'Content-Type': 'application/json',
        },
        data,
    };

    return requestConfig;
};

const getDetectedText = (results) => {
    // const { data: { results: [{ results: [{ textDetection }] }] } } = response;
    const { results: [{ textDetection }]} = results[0];

    const detectedText = textDetection.pages.map(({ blocks }) => {
        const textblock = blocks.reduce((block, { lines }) => {
            const line = lines.reduce((acc, { words }) => {
                const phrase = words.map(({ text }) => text).join(' ');
                return [...acc, phrase];
            }, []);
            return [...block, line.join('')];
        }, []);
        return textblock.join('\n');
    });
    
    return detectedText;
};

const runApp = async () => {
    try {
        await exec(`${screenShotTool} -f ${screenShotFilePath}`);
        const file = await fsPromises.readFile(screenShotFilePath);
        const content = Buffer.from(file).toString('base64');
        
        const { data: { results }} = await axios(getRequestConfig(content));
        const detectedText = getDetectedText(results)

        const detectedTextFileName = path.join(__dirname, `../text-${Date.now()}.txt`);
        await fsPromises.writeFile(detectedTextFileName, detectedText);

    } catch (err) {
        console.log(err)
    }
};

module.exports = runApp;  
