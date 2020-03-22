const fs = require('fs');
const request = require('request');
const path = require('path');

const imageUrl = 'https://dry-plateau-3558.herokuapp.com/image';
const bingUrlBase = 'https://bing.com';

//remove given path if exists
const removeIfExists = (urlPath) => {
    // we don't put the reject, because this function always resolves OK even the path doesn't exist
    return new Promise((resolve) => {
        if (fs.existsSync(urlPath)) {
            //if the path exists, we loop the files/dirs on it
            fs.readdirSync(urlPath).forEach((file) => {
                const currentPath = path.join(urlPath, file);
                if (fs.lstatSync(currentPath).isDirectory()) {
                    //if the path has subfolders, we call this same function recursively
                    removeIfExists(currentPath);
                } else {
                    fs.unlinkSync(currentPath);
                }
            });
            //we finally remove the folder
            fs.rmdirSync(urlPath);
        }
        //promise resolved if path existed and has been removed or if it doesn't exist
        resolve();
    });
}

const downloadImage = (uri, filename, callback) => {
    return new Promise((resolve, reject) => {
        //we create the directory
        createDir(path.dirname(filename))
        .then(
            //we request the HEAD of the url
            request.head(uri, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    console.log('content-type:', response.headers['content-type']);
                    console.log('content-length:', response.headers['content-length']);
                    //we create the file with the filename of the image
                    let file =  fs.createWriteStream(path.resolve(filename));
                    //we download de image and pipe it to the file
                    var stream = request(uri).pipe(file);
                    stream.on('finish', () => {
                        resolve("image downloaded!");
                    })
                    .on('error', () => {
                        reject("error downloading the image");
                    })     
                }
            })
        )
        .catch(err => {
            reject(err)
        })
    });
}

//create dir for image
const createDir = (urlPath) => {
    // we don't put the reject, because this function always resolves OK even the path doesn't exist
    return new Promise((resolve, reject) => {
        urlPath = path.resolve(urlPath);
        //we create the directory
        fs.mkdir(urlPath, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        })
    });
}

const downloadJSON = () => {
    return new Promise((resolve, reject) => {
        //we download the JSON request
        request(imageUrl, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                //if request OK, parse JSON first object (contains image)
                var bodyJSON = JSON.parse(body);
                var imagesJSON = bodyJSON["images"][0];
                var image = bingUrlBase + imagesJSON["url"];
                resolve(image);
            } else {
                reject(error);
            }
        })
    })
}

function downloadAndSave(argPath) {
    //if not abs path given, current directory is used 
    var destPath = path.resolve(argPath);

    removeIfExists(destPath)
    .then(
        console.log("path removed"),
        //download daily bing image
        downloadJSON()
        .then(image => {
            var imageSplit = path.basename(image).split(".jpg")[0] + ".jpg";
            downloadImage(image, destPath + "/" + imageSplit)
            .then(ok => {
                console.log(ok)
            })
            .catch(err => {
                console.error(err)
            })
        })
        .catch(err => {
            console.error(err)
        })
    )
}

module.exports = {
    downloadAndSave
};

