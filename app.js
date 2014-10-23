/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Neon Play
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
// Port for the server to run on.
var serverPort = 8081;

// Local folder (must be writable).
var folder = './cache';

// Remote prefix of URL to call (without trailing slash)
var remotePrefix = 'https://my-remote-url.com'

// Enable of disable logging
var debug = true;


var http = require('http');
var httpreq = require('httpreq');
var md5 = require('MD5');
var fs = require('fs');

var server = http.createServer(function(req, res) {

    var deleteFolderRecursive = function(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(
                function(file, index) {
                    var curPath = path + '/' + file;
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteFolderRecursive(curPath);
                    } else {
                        fs.unlinkSync(curPath);
                    }
                }
            );
            fs.rmdirSync(path);
        }
    };

    var log = function(str) {
        if (debug) {
            console.log(str);
        }
    }

    if (!fs.existsSync(folder + '/tmp')) {
        log('Creating: "' + folder + '/tmp" folder');
        fs.mkdirSync(folder + '/tmp');
    }

    var url = req.url;
    if (url === '/favicon.ico') {
        log('favicon.ico requested');
        res.writeHead(404);
        res.end('Not Found');
        return;
    }
    if (url === '/delete' && req.method == 'DELETE') {
        log('Delete requested');
        deleteFolderRecursive(folder + '/tmp');
        res.writeHead(200);
        res.end('OK. Files deleted.');
        return;
    }

    var urlMd5 = md5(url);
    var localFileUrl = folder + '/tmp/' + urlMd5;
    log('Requested URL: ' + url);
    log('Hash: ' + urlMd5);
    log('Local file: ' + localFileUrl);

    var sendFile = function(fileHash) {
        log('Sending cached file');
        fs.readFile(
            localFileUrl,
            'binary',
            function(err, file) {
                if (err) {
                    log('Error sending file: "' + fileHash + '"');
                    res.writeHead(500);
                    res.write('');
                    res.end();
                    return;
                }

                log('File sent: "' + fileHash + '"');
                res.writeHead(200);
                res.write(file, 'binary');
                res.end();
                return;
            }
        );
    };

    if (fs.existsSync(localFileUrl)) {
        sendFile(urlMd5);
        return;
    }

    log('Caching remote version');
    httpreq.get(remotePrefix + url, {binary: true}, function(err, response) {
        if (err){
            log('Error downloading file: "' + remotePrefix + url + '"');
            res.writeHead(500);
            res.write('');
            res.end();
            return;
        }

        fs.writeFile(localFileUrl, response.body, function(err) {
            if (err) {
                log('Error writing file in: "' + localFileUrl + '"');
                res.writeHead(404);
                res.end('');
                return;
            }

            var stats = fs.statSync(localFileUrl);
            log('Downloaded file: ' + ' ' + urlMd5 + ' ' + stats['size'] + ' ' + url);
            sendFile(urlMd5);
        });
    });

    return;
});

server.listen(serverPort);
