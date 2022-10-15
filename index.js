// index.js
const path = require('path')
const bodyParser = require("body-parser");
const express = require('express')
const _ = require('lodash');
const cors = require("cors");

const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());


const { Storage } = require('@google-cloud/storage');
const gcs = new Storage({
    projectId: "biblapp-ff6b8",
    keyFilename: "./biblapp-ff6b8-firebase-adminsdk-yd0y2-f66e718c5b.json"
})

// Reference the Firebase account storage bucket
const storage = gcs.bucket('gs://biblapp-ff6b8.appspot.com');


async function fetchFileFromGoogleStorage(filename) {
    const fileObject = storage.file(filename);
    const fileContents = await fileObject.download();
    console.log('in fetchFileFromGoogleStorage');
    console.log(fileContents.length);
    return fileContents[0];
}

app.get('/hello', (request, response) => {
    response.status(200);
    response.send("hola terricolas");
});


app.get('/image', async (request, response) => {
    const downloadedImageFile = await fetchFileFromGoogleStorage('justImages/guanaco-barrancas-coloradas.jpg');
    response.status(200);
    response.type('image/jpg');
    response.send(downloadedImageFile);
});

app.get('/pdf', async (request, response) => {
    const downloadedPdfFile = await fetchFileFromGoogleStorage('pdfs/Borges Jorge - Ficciones.pdf');
    response.status(200);
    response.type('application/pdf');
    response.send(downloadedPdfFile);
});

app.listen(process.env.PORT || 3123, null, null, () => console.log("Example app started"))


