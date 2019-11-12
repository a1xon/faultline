'use strict';

const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

if (isMainThread) {
    /*
    ███╗   ███╗ █████╗ ██╗███╗   ██╗
    ████╗ ████║██╔══██╗██║████╗  ██║
    ██╔████╔██║███████║██║██╔██╗ ██║
    ██║╚██╔╝██║██╔══██║██║██║╚██╗██║
    ██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝

    */
    const Jimp = require('jimp');
    const util = require('util');
    
    const os = require('os');
    const threadCount = os.cpus().length;
    
    // consts
    const width = 1024;
    const height = 1024;
    const numIterations = 2000;
    let maxHeight = 0;
    let minHeight = 0;

    const colorRamp = [
        [0, 0, 100],
        [0, 0, 100],
        [0, 0, 100],
        [0, 0, 100],
        [0, 0, 100],
        [0, 0, 100],
        [0, 0, 155],
        [0, 0, 170],
        [0, 0, 180],
        [0, 0, 255],
        [0, 0, 255],
        [0, 0, 255],
        [0, 0, 255],
        [0, 127, 127],
        [0, 255, 0],
        [42, 255, 0],
        [85, 255, 0],
        [127, 255, 0],
        [170, 255, 0],
        [212, 255, 0],
        [255, 255, 0],
        [246, 226, 0],
        [238, 197, 0],
        [230, 168, 0],
        [222, 139, 0],
        [214, 110, 0],
        [206, 81, 0],
        [214, 110, 42],
        [222, 139, 85],
        [230, 168, 127],
        [238, 197, 170],
        [246, 226, 212],
        [255, 255, 255],
    ];

    // functions
    // generate random line by picking 2 random points
    const generateRandomLines = (amount) => {
        let lines = [];
        for (let i = 0; i < amount; i++) {
            const x1 = getRandomInt(0, width - 1);
            const y1 = getRandomInt(0, height - 1);
            const x2 = getRandomInt(0, width - 1);
            const y2 = getRandomInt(0, height - 1);
            lines.push([x1,y1,x2,y2]);
        }
        return lines;
    }

    // min, max inclusive
    const getRandomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const findMaxMinHeight = (heightData) => {
        heightData.forEach((h) => {
            if (h > maxHeight) {
                maxHeight = h;
            }
            if (h < minHeight) {
                minHeight = h;
            }
        });
    }

    const normalize = (num, min, max) => {
        return (num - min) / (max - min);
    }

    //still fairly expensive on large images
    const heightDataToColorBuffer = (heightData) => {
        let colorData = [];
        for (let i = 0; i < height; i++) {
            for (let k = 0; k < width; k++) {
                let currentHeight = heightData[k + i * width];
                let colorIndex = Math.floor(normalize(currentHeight, minHeight, maxHeight) * (colorRamp.length - 1));
                colorData.push(...colorRamp[colorIndex]);
            }
        }
        return Buffer.from(colorData);
    }

    // save buffer to file, buffer is rgb data
    const saveImage = util.promisify(function (buffer, filename, callback) {
        new Jimp({ data: buffer, width: width, height: height }, (err, image) => {
            if (err) {
                return callback(err);
            }
            image.write(filename, callback)
        });
    });

    /*
     ██████╗ ███████╗███╗   ██╗███████╗██████╗  █████╗ ████████╗███████╗    ██╗███╗   ███╗ █████╗  ██████╗ ███████╗
    ██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝    ██║████╗ ████║██╔══██╗██╔════╝ ██╔════╝
    ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██████╔╝███████║   ██║   █████╗      ██║██╔████╔██║███████║██║  ███╗█████╗
    ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ██╔══██╗██╔══██║   ██║   ██╔══╝      ██║██║╚██╔╝██║██╔══██║██║   ██║██╔══╝
    ╚██████╔╝███████╗██║ ╚████║███████╗██║  ██║██║  ██║   ██║   ███████╗    ██║██║ ╚═╝ ██║██║  ██║╚██████╔╝███████╗
     ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝

    */

    const generateImage = async () => {
    // generate randomlines
    const randomLines = generateRandomLines(numIterations);
    // seperate y-axis for threads
    let chunkSize = (Math.ceil(height / threadCount));
  
    /// spin up workers and send worker data (lines and offsets)
    let workers = [];
    for (let thread = 0; thread < threadCount; thread++) {
        let yOffset = [thread * chunkSize, (thread < (threadCount - 1) ? ((thread + 1) * chunkSize) - 1 : height)];
        workers.push(
            new Promise((resolve, reject) => {
                const worker = new Worker(__filename, {
                    workerData: { randomLines, yOffset, width}
                });
                worker.on('message', resolve);
                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0)
                        reject(new Error(`Worker stopped with exit code ${code}`));
                });
            })
        );
    };
    let heightData = await Promise.all(workers);
    heightData = heightData.flat();
    findMaxMinHeight(heightData);
    return heightDataToColorBuffer(heightData);
    };


    const start = async () => {
        try {
            const now = Date.now();
            const buffer = await generateImage();
            await saveImage(buffer, 'test.png');
            console.log(numIterations + ' iterations took ' + (Date.now() - now) + ' ms');
        } catch (e) {
            console.error(e);
        }
    };
    start();


} else {


    /*
    ██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗███████╗██████╗
    ██║    ██║██╔═══██╗██╔══██╗██║ ██╔╝██╔════╝██╔══██╗
    ██║ █╗ ██║██║   ██║██████╔╝█████╔╝ █████╗  ██████╔╝
    ██║███╗██║██║   ██║██╔══██╗██╔═██╗ ██╔══╝  ██╔══██╗
    ╚███╔███╔╝╚██████╔╝██║  ██║██║  ██╗███████╗██║  ██║
     ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝

    */
    // https://math.stackexchange.com/a/274728/49923
    const pointSide = (x, y, x1, y1, x2, y2) => {
        return ((x - x1) * (y2 - y1)) - ((y - y1) * (x2 - x1));
    }

    const { randomLines, yOffset, width} = workerData;
    const heightData = new Array(((yOffset[1] - yOffset[0])+1) * width).fill(0);
    for (let line of randomLines) {
        let stride = 0;
        for (let y = yOffset[0]; y <= yOffset[1]; y++) {
            for (let x = 0; x < width; x++) {
                const d = pointSide(x, y, line[0], line[1], line[2], line[3]);
                const i = x + (stride * width);
                if (d > 0) {
                    heightData[i]++;
                } else if (d < 0) {
                    heightData[i]--;
                }
            }
            stride++;
        }
    }
    parentPort.postMessage(heightData);
}