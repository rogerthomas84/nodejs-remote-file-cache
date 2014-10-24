NodeJS Remote File Cache
========================

Overview
--------

This project serves as a local file cache for remote files. We're currently using this to
reduce the number of external HTTP requests to a CDN container for files.

The idea is quite simple. If you've got a file located at: `http://www.example.com/path/to/file.jpg` then you can change the domain to the server running this file (presumably internal). The URL would look something like this:
`http://192.168.1.1:8081/path/to/file.jpg`

The file is cached (based on the MD5 of the path `/path/to/file.jpg`) and is either served directly from cache, or downloaded from the remote `http://ww.example.com` domain and then cached and served.

Why use it?
-----------

CDN's are great, but when you've got a lot of people accessing a large number of remote files over a slower connection, it's faster for it to be internal.

Setup
-----

`$ npm install`

Edit the `app.js` file.

Change the following variables:

 * `serverPort` - the port to run the application on. (Default `8081`)
 * `folder` - path to local cache folder (Default `./cache`)
 * `remotePrefix` - FQDN of the remote storage (Required)
 * `debug` - When `true`, lots of logs are sent to the console.

Cleaning the Cache
------------------

You're obviously (at some point) going to need to clear the cache. To do so, simply make a `DELETE` request to `/delete`. In cURL that would look like this:

`curl -X DELETE http://localserver:8081/delete`

Contributing
------------

Simply fork the repository, make your changes and raise a PR.
