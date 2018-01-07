'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
    signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;

exports.handler = function (event, context, callback) {
    const key = event.queryStringParameters.key;
    console.log(key);

    const match = key.match(/(.*)\-(\d+)\.(.*)/);

    const fileKey = match[1];
    const width = parseInt(match[2], 10);
    const extension = match[3];

    const originalKey = fileKey + '.' + extension;

    S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
        .then(data => Sharp(data.Body)
        .resize(width)
        .toFormat('jpeg')
        .toBuffer()
    ).then(buffer => S3.putObject({
        Body: buffer,
        Bucket: BUCKET,
        ContentType: 'image/jpeg',
        Key: key,
        ACL: "public-read"
      }).promise()
    ).then(() => callback(null, {
        statusCode: '301',
        headers: {'location': `${URL}/${key}`},
        body: '',
      })
    ).catch(err => callback(err))
}
