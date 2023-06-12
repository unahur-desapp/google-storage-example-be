// index.js
const path = require('path')
const bodyParser = require("body-parser");
const express = require('express')
const _ = require('lodash');
const cors = require("cors");
const multer  = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// multer config
const multerStorage = multer.memoryStorage();
const multerFileHandler = multer({ storage: multerStorage });

// Google Storage config
const gcs = new Storage({
    projectId: "biblapp-ff6b8",
    keyFilename: "./biblapp-ff6b8-f08a481d7b33.json"
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

// una ruta de prueba
app.get('/hello', (request, response) => {
    response.status(200);
    response.send("hola terricolas");
});

// obtiene una imagen desde Google Cloud Storage y la envía en la response
app.get('/image', async (request, response) => {
    const downloadedImageFile = await fetchFileFromGoogleStorage('justImages/guanaco-barrancas-coloradas.jpg');
    response.status(200);
    response.type('image/jpg');
    response.send(downloadedImageFile);
});

// obtiene un documento PDF desde Google Cloud Storage y lo envía en la response
app.get('/pdf', async (request, response) => {
    const filename = `pdfs/${request.query.filename || 'Borges Jorge - Ficciones'}.pdf`
    const downloadedPdfFile = await fetchFileFromGoogleStorage(filename);
    response.status(200);
    response.type('application/pdf');
    response.send(downloadedPdfFile);
});

// upload de un documento pdf (pero creo que sirve para cualquier archivo)
// se espera un request multipart con un file llamado uploadedPdf, y en la parte de texto un atributo filename
// (sin la extensión PDF, que se la pone el código del endpoint)
app.post('/pdf', multerFileHandler.single('uploadedPdf'), async (request, response) => {
    // observo el request
    console.log(Object.keys(request.file));
    console.log({ originalname: request.file.originalname, mimetype: request.file.mimetype });
    console.log(request.body.filename);

    // implemento el upload
    const newFilePath = `pdfs/${request.body.filename}.pdf`;

    // paso 1 - se crean el archivo, y el stream donde se va a inyectar el contenido
    const blob = storage.file(newFilePath);
    const blobStream = blob.createWriteStream();

    // paso 2 - se inyecta el contenido
    // a mí tampoco me gusta cómo queda el código, pero no encontré alternativa
    // cfr la documentación - https://cloud.google.com/appengine/docs/flexible/using-cloud-storage?tab=node.js#top
    blobStream.on('error', err => {
        response.status(500);
        response.json({ ok: false, errorDescription: err });
    });
    
    blobStream.on('finish', () => {
        response.status(200);
        response.json({ ok: true, path: newFilePath });
    });
    
    blobStream.end(request.file.buffer);
});

app.listen(process.env.PORT || 3123, null, null, () => console.log("Example app started"))

