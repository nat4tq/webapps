'use strict';

const http = require('http'),
  url = require('url'),
  querystring = require('querystring');

let param_value = 'mystring';
const post = {
  host: 'localhost',
  port: '8989',
  method: 'GET',
  url: 'http://localhost',
  path: '/' + "?" + querystring.stringify({name: param_value.taint()})
};

(() => {
  const server = http.createServer((req, res) => {
    let q = url.parse(req.url, true).query;
    res.writeHeader(200, {"Content-Type": "text/html"});
    res.end('<p>' + q.name + '</p>'); //q.name is tainted
  });

  server.on('error', (e) => {
    console.log(e);
  });

  // HTTP GET request
  server.listen(8989, () => {
    http.get(8989, () => {
      const request = http.request(post, (response) => {

        let all_chunks = [];
        response.on('data', (chunk) => {
          all_chunks.push(chunk);
        });

        response.on('end', () => {
          let body = Buffer.concat(all_chunks).toString().untaint();
          const re = new RegExp(param_value,"g");
          body =  body.replace(re, param_value.taint());
          console.log('Body: ', body);  // prints '<p>mystring</p>'
          console.log('Taint info: ', body.getTaint()); // returns [ { begin: 0, end: 34, flow: [ [Object] ] } ]
          console.log('Desired output: ', ('<html><body>' + param_value.taint() + '</body></html>').getTaint());
        });
        server.close();
      });

      request.end();
    });
  });

})();

