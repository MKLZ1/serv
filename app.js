const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const cookieParser = require("cookie-parser");
// const Image = require("./models/Image");

const cors = require("cors");
const serverController = require("./controllers/serverController");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const userController = require("./controllers/userController");
const extraerUsuario = require("./middleware/extraerUsuario");
const ServerManager = require("./ServerManager");
const User = require("./models/User");
let dbURI =
  "mongodb+srv://user:$Password12$@cluster0.nybh2.mongodb.net/game?retryWrites=true&w=majority";

const app = express();
const port = 3000;
let wsServer;

start();

async function start() {
  await mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  var server = app.listen(port, () => {
    console.log(`El servidor está escuchando en el puerto ${port}`);
  });
  const WebSocketServer = require("websocket").server;
  wsServer = new WebSocketServer({
    httpServer: server,
  });

  wsServer.on("request", wsServerRequest);
}
const corsOptions = {
  origin: true, //included origin as true
  credentials: true,
};
//   app.use(function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', req.headers.origin);
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
app.use("*", extraerUsuario);

app.get("/user/image", async (req, res, next) => {
  // console.log("entrando");
  if (res.locals.user == null) {
    next();
    return;
  }
  let user = await User.findOne({ username: res.locals.user.username }).lean();

  res.json(user.images);
});
app.post("/user/map/get", async (req, res, next) => {
  if (res.locals.user == null) {
    next();
    return;
  }
  const user = await User.findOne({ username:req.body.username });  
  res.json({map:user.map});
});
app.get("/token/verify", async (req, res, next) => {
  if(res.locals.user!=null){
    res.json({message:"token valid"});
  }else{
    res.json({error:"token invalid"});
  }
});
app.post("/user/map", async (req, res, next) => {
  if (res.locals.user == null) {
    next();
    return;
  }
  const user = await User.findOne({ username:res.locals.user.username });
  user.map = JSON.stringify(req.body);
  await user.save();
  res.send("se guardo el mapa");
});
app.post("/server/images", async (req, res, next) => {
  const urls = req.body;
  const base64Images = [];
  const imageUsers = new Map();
  const urlsValid = [];
  for (const url of urls) {
    const dataList = url.trim().split("/");
    const username = dataList[0];
    const filename = dataList[1];
    let user;
    if (imageUsers.get(username) == null) {
      user = await User.findOne({ username });
      imageUsers.set(username, user);
    } else {
      user = imageUsers.get(username);
    }
    let base64image;
    for (const imageData of user.images) {
      if (filename == imageData.name) {
        base64image = imageData.base64;
        break;
      }
    }
    urlsValid.push(url);
    base64Images.push(base64image);
  }
  res.json({ images: base64Images,urls:urlsValid });
});
app.post("/user/signup", userController.signup);
app.post("/user/login", userController.login);
app.post("/user/image/upload", async (req, res) => {
  // console.log(req.body); // esta línea imprimirá la información del archivo en la consola
  // const imagen = {
  //   name: req.body.name,
  //   desc: 'imagen',
  //   img: Buffer.from(req.body.file, 'base64').toString("base64")
  // };
  let user = await User.findOne({ username: req.body.username });
  // console.log("se envia ",imagen,"file ",req.body.file);
  user.images.push(req.body);
  await user.save();
  res.send("Archivo recibido correctamente");
});

app.get("/server", serverController.getAll);

app.use("*", (req, res) => {
  const error =
    res.locals.user == null
      ? "el usuario no esta logeado"
      : "el recurso no existe";
  res.status(400).json({ error });
});

async function wsServerRequest(request) {
  const token = request.resourceURL.query.token;

  const decodedToken = await jwt.verify(token, "efe");

  const connection = request.accept(null, request.origin);
  const user = { username: decodedToken.username, connection };
  console.log("se conecto ", user.username);
  ServerManager.getInstance().setUser(user);
  connection.on("message", function (message) {
    let data = JSON.parse(message.utf8Data);
    wsServerController(data.action, user, data.content, connection);
  });

  connection.on("close", function (reasonCode, description) {
    ServerManager.getInstance().deleteUser(user);
    console.log("Client has disconnected. ", user.username);
  });
}

function wsServerController(action, user, content, connection) {
  if (action == "request/server/create") {
    ServerManager.getInstance().setServer(user);
    let resp = {
      action: "response/server/list",
      content: ServerManager.getInstance().getServers(),
    };
    let respJSON = JSON.stringify(resp);
    // connection.send(respJSON);
    for (const user of ServerManager.getInstance().getUsers()) {
      //   if (ServerManager.getInstance().servers.has(user.username)) {
      //     continue;
      //   }
      user.connection.send(respJSON);
    }
  } else if (action == "request/server/list") {
    let resp = {
      action: "response/server/list",
      content: ServerManager.getInstance().getServers(),
    };
    let respJSON = JSON.stringify(resp);
    connection.send(respJSON);
  } else if (action == "request/server/descriptionAnswer") {
    console.log("QUIEREN DESCRIPTION ANSWER");
    const server = ServerManager.getInstance().servers.get(
      content.creatorUsername
    );
    server.setCandidateOffer(user.username, content.candidate);

    let resp = {
      action: "request/server/descriptionAnswer",
      content: {
        descriptionOffer: content.description,
        friendUsername: user.username,
      },
    };
    let respJSON = JSON.stringify(resp);

    const creator = ServerManager.getInstance().users.get(
      content.creatorUsername
    );
    console.log("ENVIANDO SOLICITUD DE DESCRIPTION ANSWER AL SERVIDOR");
    creator.connection.send(respJSON);
  } else if (action == "response/server/descriptionAnswer") {
    let resp = {
      action: "response/server/descriptionAnswer",
      content: {
        descriptionAnswer: content.description,
        candidateAnswer: content.candidate,
        creatorUsername: user.username,
      },
    };
    let respJSON = JSON.stringify(resp);

    const friend = ServerManager.getInstance().users.get(
      content.friendUsername
    );
    friend.connection.send(respJSON);
  } else if (action == "request/server/endAnswer") {
    const creator = ServerManager.getInstance().users.get(
      content.creatorUsername
    );
    const server = ServerManager.getInstance().servers.get(
      content.creatorUsername
    );
    const candidateOffer = server.getCandidateOffer(user.username);
    let resp = {
      action: "request/server/endAnswer",
      content: {
        friendUsername: user.username,
        candidateOffer,
      },
    };
    let respJSON = JSON.stringify(resp);
    creator.connection.send(respJSON);
  }
}
