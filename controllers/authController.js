const Paciente = require("../models/Paciente");
const Doctor = require("../models/Doctor");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

module.exports.login_post = async (req, res) => {
  const dni = req.body.dni;
  const password = req.body.password;
  const tipoUsuario = req.body.tipoUsuario;

  const passwordBD = await getPasswordBD(tipoUsuario,dni);
  let mensaje ="DNI no registrado o contraseña incorrecta";

  if(passwordBD){
    const logeado = await bcrypt.compare(password,passwordBD);

    if(logeado){
      const token = crearToken(dni, tipoUsuario);
      res.cookie("jwt", token, { httpOnly: true, maxAge: tiempoMaximo * 1000 }); 
      mensaje= "";
    }
  }
  res.status(201).json({ mensaje });
};

module.exports.login_get = (req, res, next) => {
    res.render("autenticacion/login");
};
module.exports.logout_get = (req, res,next) => {
  if (res.locals.user) {
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/");
  } else {
    res.redirect("/");
  }
};
const tiempoMaximo = 30000; //segundos

const crearToken = (id, tipoUsuario) => {
  return jwt.sign({ id, tipoUsuario }, "efe", {
    expiresIn: tiempoMaximo,
  });
};

async function getPasswordBD(tipo,dni){
  let usuario = null;
  if(tipo=="doctor"){
    usuario = await Doctor.findOne({dni});
  }else if(tipo == "paciente"){
    usuario = await Paciente.findOne({dni});
  }
  if(usuario==null) return null;

  return usuario.password;
}
