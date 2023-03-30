const express = require("express");
const app = express();
const port = 3000;
var globalId = 0;
let servidoresPendientes = [];

var server = app.listen(port, () => {
  console.log(`El servidor está escuchando en el puerto ${port}`);
});
const WebSocketServer = require('websocket').server;
const wsServer = new WebSocketServer({
    httpServer: server
});

app.use(express.json());

app.post("/createServer", (req, res) => {
  const jsonBody = req.body; // objeto JSON recibido desde Flutter
  // procesar el objeto JSON aquí
  console.log("creando servidor");
  res.status(200).send("JSON recibido correctamente");
});
wsServer.on('request', function(request) {
  
    const connection = request.accept(null, request.origin);
    connection.on('message', function(message) {
    let object = JSON.parse(message.utf8Data);
        console.log(object);
      controller(object.type,object.action, object.content,connection);
    });
    
    connection.on('close', function(reasonCode, description) {
        console.log('Client has disconnected.');
    });
});

function controller(type,action,content,connection){
    if(type=="server"){
        controllerServer(action,content,connection);
    }
    
}

function controllerServer(action,content,connection){
    if(action=="create"){
        servidoresPendientes.length = 0;
        servidoresPendientes.push(createServer());
        let resp = {type:"server",action:"create",content:servidoresPendientes};
        let respJSON = JSON.stringify(resp);
        // console.log("se envia",respJSON);
        connection.send(respJSON);
        wsServer.broadcast(respJSON);
    }else if(action=="offer"){
        let resp = {type:"server",action:"offer",content:JSON.stringify(content)};
        let respJSON = JSON.stringify(resp);
        wsServer.broadcast(respJSON);
    }else if(action=="candidateOffer"){
        let resp = {type:"server",action:"candidateOffer",content:JSON.stringify(content)};
        let respJSON = JSON.stringify(resp);
        wsServer.broadcast(respJSON);
    }else if(action=="answer"){
        let resp = {type:"server",action:"answer",content:JSON.stringify(content)};
        let respJSON = JSON.stringify(resp);
        wsServer.broadcast(respJSON);
    }else if(action=="candidateAnswer"){
        let resp = {type:"server",action:"candidateAnswer",content:JSON.stringify(content)};
        let respJSON = JSON.stringify(resp);
        wsServer.broadcast(respJSON);
    }
}

function createServer(){
    let server = {};
    server.id = globalId++;
    return server;
}

