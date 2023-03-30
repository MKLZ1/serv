const jwt = require("jsonwebtoken");


module.exports = async (req, res, next) => {
  if(req.headers.authorization!=null){
    const token = req.headers.authorization.split(' ')[1];
    extraerUsuario(res, token);
  }
  
  next();
};

const extraerUsuario =  async(res, token) => {
  res.locals.user = null;
  if (token) {
     await jwt.verify(token, "efe",(err,decoded)=>{
      if(!err){
        let username = decoded.username;

        res.locals.user = {username};
      }
    });
    // console.log("EL TOKEN DECODE ES ",decodedToken);
   
  }
};


