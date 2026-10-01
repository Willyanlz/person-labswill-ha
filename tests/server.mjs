import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root=process.cwd();
http.createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><html lang="pt"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>');return;}
  try {const body=await readFile(path);res.writeHead(200,{'Content-Type':extname(path)==='.js'?'text/javascript':extname(path)==='.svg'?'image/svg+xml':'text/plain'}).end(body);}
  catch{res.writeHead(404).end();}
}).listen(8769,'127.0.0.1');
