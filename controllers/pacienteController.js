const Cita = require("../models/Cita");
const AreaMedica = require("../models/AreaMedica");
const Doctor = require("../models/Doctor");
const Paciente = require("../models/Paciente");
const HistoriaClinica = require("../models/HistoriaClinica");

module.exports.cita_get = async (req, res, next) => {
  if (res.locals.user.tipoUsuario === "paciente") {
    const idCitas = res.locals.user.citas;
    let pagina = req.query.pag;
    let citasBD = await Cita.find()
      .where("_id")
      .in(idCitas)
      .populate("doctor")
      .populate("areaMedica")
      .lean()
      .exec();
      citasBD = citasBD.reverse();

      let respuesta = getItemsDePagina(citasBD,pagina,7);
      res.locals.citas = respuesta.nuevaLista;
      res.locals.numPag = respuesta.numTotalPaginas;
      res.locals.actualPag = respuesta.pagina;
    res.render("paciente/vercitaspendientespaciente");
  } else {
    next();
  }
};

module.exports.cita_create_get = async (req, res, next) => {
  if (res.locals.user.tipoUsuario === "paciente") {
    res.locals.areasMedicas = await AreaMedica.find()
      .populate("doctores")
      .lean()
      .exec();
    res.render("registro/registroCita");
  } else {
    next();
  }
};

module.exports.cita_create_post = async (req, res) => {
  const datosCita = req.body;
  datosCita.estado = "Pendiente";

  const nuevaCita = new Cita(datosCita);
  await nuevaCita.save();

  const doctor = await Doctor.findById(datosCita.doctor);
  doctor.citas.push(nuevaCita._id);
  await doctor.save();

  const paciente = await Paciente.findById(datosCita.paciente);
  paciente.citas.push(nuevaCita._id);
  await paciente.save();
  res.status(200).end();
};


module.exports.historia_get = async (req, res, next) => {
  if (res.locals.user.tipoUsuario === "paciente") {
    let pagina = req.query.pag;
    const historiaClinica = await HistoriaClinica.findById(
      res.locals.user.historiaClinica
    )
      .populate([
        { path: "hojasClinicas.doctor" },
        { path: "hojasClinicas.areaMedica" },
      ])
      .lean()
      .exec();
    let hojasClinicas = historiaClinica.hojasClinicas.reverse();
    let resultado = getItemsDePagina(hojasClinicas, pagina, 10);

    for (let h of resultado.nuevaLista) h.numero = resultado.nuevaLista.indexOf(h) + 1;
  
    res.locals.hojasClinicas = resultado.nuevaLista;
    res.locals.numPag = resultado.numTotalPaginas;
    res.locals.actualPag = resultado.pagina;
    res.render("paciente/historia");
  } else {
    next();
  }
};

module.exports.cita_cancel_post = async (req, res) => {
  const cita = await Cita.findById(req.body.idCita);
  cita.estado = "Cancelado";
  cita.motivoCancelacion = req.body.motivo;
  await cita.save();
  res.status(200).end();
};

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
