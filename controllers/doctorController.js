const HistoriaClinica = require("../models/HistoriaClinica");
const Paciente = require("../models/Paciente");
const AreaMedica = require("../models/AreaMedica");
const Cita = require("../models/Cita");
module.exports.cita_get = async (req, res, next) => {
  if (res.locals.user.tipoUsuario === "doctor") {
    const idcitas = res.locals.user.citas;
    let pagina = req.query.pag;
    let citasBD = await Cita.find()
      .where("_id")
      .in(idcitas)
      .populate("paciente")
      .populate("areaMedica")
      .lean()
      .exec();

      citasBD = citasBD.reverse();
      let respuesta = getItemsDePagina(citasBD, pagina,7);
      res.locals.citas = respuesta.nuevaLista;
      res.locals.numPag = respuesta.numTotalPaginas;
      res.locals.actualPag = respuesta.pagina;
    res.render("doctor/vercitaspendientesdoctor");
  } else {
    next();
  }
};

module.exports.historia_create_get = async (req, res, next) => {
  if (res.locals.user.tipoUsuario === "doctor") {
    res.locals.paciente = await Paciente.findOne({
      dni: req.params.dniPaciente,
    }).lean();
    if(res.locals.paciente==null){
      next();
      return;
    }
    res.locals.areasMedicas = await AreaMedica.find().lean();
    res.render("doctor/historia/create");
  } else {
    next();
  }
};

module.exports.historia_create_post = async (req, res) => {
  const datosHojaClinica = req.body;
  datosHojaClinica.doctor = res.locals.user._id;
  const paciente = await Paciente.findOne({ dni: req.body.dniPaciente }).lean();
  const historiaPaciente = await HistoriaClinica.findById(
    paciente.historiaClinica
  );
  historiaPaciente.hojasClinicas.push(datosHojaClinica);
  await historiaPaciente.save();
  res.status(201).json(req.body);
};

module.exports.historia_all_get = async (req, res, next) => {
  if (res.locals.user.tipoUsuario === "doctor") {
    const pacientesBD = await Paciente.find({}).lean();
    let pacientes = [];
    let pagina = req.query.pag;
    let tipoBusqueda = req.query.tipoBusqueda;
    let datoBusqueda = req.query.datoBusqueda;
    if (tipoBusqueda == null) tipoBusqueda = "";
    if (datoBusqueda == null) datoBusqueda = "";
    tipoBusqueda = tipoBusqueda.toLowerCase();

    res.locals.tipoBusqueda = tipoBusqueda;
    res.locals.datoBusqueda = datoBusqueda;

    if (!esTipoBusquedaValido(tipoBusqueda) || datoBusqueda.trim() == "") {
      pacientes = pacientesBD;
    } else {
      for (pBD of pacientesBD) {
        if (!esPacienteValido(pBD, tipoBusqueda, datoBusqueda)) continue;
        pacientes.push(pBD);
      }
    }
    cargarPacientes(res.locals, pagina, pacientes);
    res.render("doctor/busquedahistoriaclinica");
  } else {
    next();
  }
};
module.exports.historia_get = async (req, res, next) => {
 
    if (res.locals.user.tipoUsuario === "doctor") {
      let dniPaciente = req.params.dniPaciente;
      let paciente = await Paciente.findOne({dni:dniPaciente});
      let pagina = req.query.pag;
    
      let historiaClinica = await HistoriaClinica.findById(paciente.historiaClinica).populate([
        { path: "hojasClinicas.doctor" },
        { path: "hojasClinicas.areaMedica" },
      ])
      .lean()
      .exec();
      let hojasClinicas = historiaClinica.hojasClinicas.reverse();
      let resultado = getItemsDePagina(hojasClinicas, pagina, 3);
      const hojasPorPagina = resultado.nuevaLista;
      for (let h of hojasPorPagina) {
        h.numero = hojasClinicas.indexOf(h) + 1;
      }
      res.locals.paciente = paciente;
      res.locals.dniPaciente = dniPaciente;
      res.locals.hojasClinicas = hojasPorPagina;
      res.locals.numPag = resultado.numTotalPaginas;
      res.locals.actualPag = resultado.pagina;
    
      res.render("doctor/listahojaclinicaparadoctor");
    }else{
      next();
    }

}
  
function cargarPacientes(locals, pagina, pacientesBD) {
  let pacientesPag = [];
  let numPacientesXpagina = 10;
  let numTotalPag = Math.ceil(pacientesBD.length / numPacientesXpagina);
  if (numTotalPag == 0) numTotalPag = 1;
  if (pagina == null || isNaN(pagina) || pagina < 0 || pagina > numTotalPag) {
    pagina = 1;
  }

  let indiceIni = numPacientesXpagina * (pagina - 1);
  for (let i = 0; i < pacientesBD.length; i++) {
    if (i >= indiceIni && i < indiceIni + numPacientesXpagina) {
      pacientesPag.push(pacientesBD[i]);
    }
  }
  const respuesta = getItemsDePagina(pacientesBD, pagina, 10);
  locals.pacientes = respuesta.nuevaLista;
  locals.numPag = respuesta.numTotalPaginas;
  locals.actualPag = respuesta.pagina;
}

function esPacienteValido(paciente, tipoBusqueda, datoBusqueda) {
  if (tipoBusqueda == "nombre") {
    return contienePalabra(
      datoBusqueda,
      paciente.nombre + " " + paciente.apellido
    );
  } else if (tipoBusqueda == "dni") {
    if (paciente.dni == datoBusqueda) return true;
  }
}
function esTipoBusquedaValido(tipoBusqueda) {
  return tipoBusqueda == "dni" || tipoBusqueda == "nombre";
}
function contienePalabra(pedazoTexto, texto) {
  texto = texto.toLowerCase().trim();
  pedazoTexto = " " + pedazoTexto.toLowerCase();
  let palabras = texto.split(" ");
  for (let p of palabras) {
    p = " " + p;
    if (p.split(pedazoTexto).length == 2) return true;
  }
  return false;
}

function getItemsDePagina(lista, pagina, itemsPorPagina) {
  let numTotalPaginas = Math.ceil(lista.length / itemsPorPagina);
  if (pagina == null || isNaN(pagina) || pagina <= 0 || pagina > numTotalPaginas) {
    pagina = 1;
  }
  if (numTotalPaginas == 0) numTotalPaginas = 1;
  const posInicial = itemsPorPagina * (pagina - 1);
  const posFinal = posInicial + itemsPorPagina;
  const nuevaLista = [];
  for (let i = 0; i < lista.length; i++) {
    if (i >= posInicial && i < posFinal) {
      nuevaLista.push(lista[i]);
    }
  }

  return { nuevaLista, numTotalPaginas,pagina };
}