const Paciente = require("../models/Paciente");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcrypt");
const HistoriaClinica = require("../models/HistoriaClinica");
const Admin = require("../models/Admin");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const generadorController = require("../tools/generadorController");
const jwt = require("jsonwebtoken");

module.exports.login_get = (req, res, next) => {
  
  res.render("Administrador/loginadmin");
};
module.exports.login_post = async (req, res) => {
 
  const usuario = req.body.usuario;
  const password = req.body.password;
  const admin = (await Admin.find())[0];
  let usuarioBD =  admin.usuario;
  let passwordBD = admin.password;

  // const passwordBD = await getPasswordBD(tipoUsuario,dni);
  let mensaje ="Usuario o contraseña incorrecta";
 
  if(usuario==usuarioBD&&password == passwordBD){
    const token = crearToken(usuario, "admin");
    res.cookie("jwt", token, { httpOnly: true, maxAge: tiempoMaximo * 1000 }); 
    mensaje= "";
  }

  res.status(201).json({ mensaje });
};
module.exports.dni_valido_post = async (req, res, next)=>{
  const dni = req.body.dni;
  const tipoUsuario = req.body.tipoUsuario;
  let usuario = null;
  let usuarioBD = null;
  if(tipoUsuario == "paciente"){
    usuarioBD = await Paciente.findOne({dni});
  }else if(tipoUsuario == "doctor"){
    usuarioBD = await Doctor.findOne({dni});
  }else{
    res.status(400).json({ error: "Tipo de usuario no valido" });
    return;
  }
  if(usuarioBD!=null){
    res.status(400).json({ error: "El DNI ya ha sido registrado" });
    return;
  }
  try{
    usuario= await (await fetch("https://frozen-hollows-68632.herokuapp.com/api/v1/dni/"+dni.trim()+"?token=abcxyz")).json();
  }catch(error){
    res.status(400).json({ error: "El DNI no existe en la RENIEC" });
    return;
  }
  
  res.status(200).json({nombre:usuario.nombres,apellido:usuario.apellidoPaterno+" "+usuario.apellidoMaterno});
};
module.exports.registro_post = async (req, res, next) => {
  const body = req.body;
  const tipoUsuario = body.tipoUsuario;
  const dni = body.dni;
  let datosUsuario = {
    dni: body.dni,
    email: body.email,
    telefono: body.telefono,
    password: body.password,
    tipoUsuario: body.tipoUsuario,
    estado: "activo",
  };
  let usuarioReniec = null;
  let usuarioBD = null;
  if(tipoUsuario == "paciente"){
    usuarioBD = await Paciente.findOne({dni});
  }else if(tipoUsuario == "doctor"){
    usuarioBD = await Doctor.findOne({dni});
  }else{
    res.status(400).json({ error: "Tipo de usuario no valido" });
    return;
  }
  if(usuarioBD!=null){
    res.status(400).json({ error: "El DNI ya ha sido registrado" });
    return;
  }
  try{
    usuarioReniec = await (await fetch("https://frozen-hollows-68632.herokuapp.com/api/v1/dni/"+datosUsuario.dni.trim()+"?token=abcxyz")).json();
  }catch(error){
    res.status(400).json({ error: "DNI no registrado en la RENIEC" });
    return;
  }
  datosUsuario.nombre = usuarioReniec.nombres;
  datosUsuario.apellido = usuarioReniec.apellidoPaterno+" "+usuarioReniec.apellidoMaterno;
  datosUsuario.password = await getPasswordBcrypt(datosUsuario.password);

  let nuevoUsuario = null;
  if (tipoUsuario == "paciente") {
    const historiaClinica = new HistoriaClinica();
    await historiaClinica.save();
    datosUsuario.telefonoFamiliar = body.telefonoFamiliar;
    datosUsuario.direccion = body.direccion;
    datosUsuario.historiaClinica = historiaClinica._id;
    nuevoUsuario = new Paciente(datosUsuario);

  } else if (tipoUsuario == "doctor") {
    datosUsuario.yearXp = body.yearXp;
    datosUsuario.especialidad = body.especialidad;

    nuevoUsuario = new Doctor(datosUsuario);
    
  }

  await nuevoUsuario.save();
  if(tipoUsuario=="doctor"){
    await generadorController.generarDatosDoctor(nuevoUsuario);
  }else if(tipoUsuario == "paciente"){
    await generadorController.generarDatosPaciente(nuevoUsuario);
  }


  res.status(201).json({ data: req.body });
};



async function getPasswordBcrypt(password){
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password,salt);
}
const tiempoMaximo = 30000;
const crearToken = (id, tipoUsuario) => {
  return jwt.sign({ id, tipoUsuario }, "efe", {
    expiresIn: tiempoMaximo,
  });
};
