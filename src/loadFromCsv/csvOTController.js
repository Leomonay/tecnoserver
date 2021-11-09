const mongoose = require("mongoose");
const WOoptions = require("../models/WOoptions");
const Users = require("../models/User");
const UserOptions = require("../models/UserOptions");
const {fromCsvToJson,
  collectError,
  finalResults,
  getDate} = require('../utils/utils')
const Plant = require("../models/Plant");
const WorkOrder = require("../models/WorkOrder");
const Device = require("../models/Device");
const ServicePoint = require("../models/ServicePoint");


const OTstatus = {
  PEN: "Abierta",
  CER: "Cerrada",
  ANU: "Anulada",
};
const OTclass = {
  INSP: "Inspección",
  "MAN/EME": "Mantenimiento de emergencia",
  MANT: "Mantenimiento",
  MONT: "Montaje de equipos",
  PREV: "Preventivo",
  RECL: "Reclamo",
  TALL: "Taller",
};
const macroCauses = {
  "i&m": "Ingeniería y Mantenimiento",
  el: "Problema eléctrico",
  mec: "Problema mecánico",
  ter: "Problema térmico",
  oth: "Otros",
};
const OTCause = {
  "06": { name: "INSPECCION", macro: macroCauses["i&m"] },
  AL: { name: "ALARMA", macro: macroCauses["i&m"] },
  AN: { name: "PREVENTIVO", macro: macroCauses["i&m"] },
  B: { name: "FALTA GAS REFRIGERANTE", macro: macroCauses.ter },
  CS: { name: "CONDENSADOR SUCIO", macro: macroCauses.ter },
  EQ: { name: "EQUIPO DESHABILITADO", macro: macroCauses.el },
  EQC: { name: "EQUIPO CONGELADO", macro: macroCauses.ter },
  EQD: { name: "EQUIPO DESMONTADO", macro: macroCauses["i&m"] },
  EQS: { name: "EQUIPO SUCIO", macro: macroCauses.ter },
  ES: { name: "EVAPORADOR SUCIO", macro: macroCauses.ter },
  K: { name: "FILTROS DE AIRE", macro: macroCauses.ter },
  MON: { name: "MONTAJE DE EQUIPO NUEVO", macro: macroCauses["i&m"] },
  MT: { name: "MANTENIMIENTO", macro: macroCauses["i&m"] },
  NIN: { name: "NINGUNA FALLA", macro: macroCauses.oth },
  O: { name: "OTRO", macro: macroCauses.oth },
  PE: { name: "PERDIDA DE GAS", macro: macroCauses.ter },
  PEL: { name: "PROBLEMA ELECTRONICO", macro: macroCauses.el },
  SET: { name: "MAL SETEADO", macro: macroCauses.ter },
  T: { name: "PROBLEMA ELECTRICO", macro: macroCauses.el },
  TE: { name: "PROBLEMA TERMICO", macro: macroCauses.ter },
  U: { name: "PROBLEMA MECANICO", macro: macroCauses.mec },
  X: { name: "PERDIDA DE AGUA", macro: macroCauses.mec },
};

const tipoProb = {
  A: "EQUIPO PARADO",
  B: "NO FUNCIONA",
  C: "NO ENFRIA",
  D: "SALTA TERMICA",
  G: "PERDIDA DE AGUA",
  H: "NO CALEFACCIONA",
  I: "PROBLEMA ELECTRICO",
  J: "OLOR EXTRAÑO",
  k: "ANDA EN VENT. SOLAMENTE",
  L: "RUIDO",
  M: "EMERGENCIA",
  n: "ALTA TEMPERATURA",
  r: "RECORRIDA DE EQUIPOS",
  w: "BAJA TEMPERATURA",
  X: "ORDEN DE TRABAJO",
  z: "OTRO",
};

const access = {
  "MEDIO OFICIAL": "Worker",
  SUPERVISOR: "Supervisor",
  "MEDIO OFICIAL1": "Worker",
  OFICIAL: "Worker",
  "LIDER TALLER": "Supervisor",
  GERENTE: "Admin",
  OPERARIO: "Worker",
  "LIDER MTO": "Supervisor",
};
const charges = {
  "MEDIO OFICIAL": "Medio Oficial",
  SUPERVISOR: "Líder",
  "MEDIO OFICIAL1": "Medio Oficial",
  OFICIAL: "Oficial",
  "LIDER TALLER": "Líder Taller",
  GERENTE: "Gerente",
  OPERARIO: "Operario",
  "LIDER MTO": "Líder",
};

async function createWOoptions() {
  try {
    const Opciones = await WOoptions({
      name: "Work Orders Options",
      status: Object.values(OTstatus).sort(),
      classes: Object.values(OTclass).sort(),
      causes: Object.values(OTCause).sort(),
      issueType: Object.values(tipoProb).sort(),
    });
    await Opciones.save();
    return { ok: { WOoptions: Opciones } };
  } catch (e) {
    return { error: { proceso: e.message } };
  }
}

async function createUserOptions() {
  try {
    const Opciones = await UserOptions({
      name: "Users Options",
      access: ["View", "Client", "Worker", "Internal", "Supervisor", "Admin"],
      charge: [
        "Operario",
        "Oficial",
        "Medio oficial",
        "Oficial múltiple",
        "Gerente",
        "Líder Taller",
      ],
    });
    const savedOptions = await Opciones.save();
    return { ok: { UserOptions: Opciones } };
  } catch (e) {
    return { error: { proceso: e.message } };
  }
}

async function createUsers() {
  const fileName = "Empleados.csv",
    item = "Personal";
  const results = { ok: [], errors: [] };
  const functionPush = (row) => {
    return {
      name: row.Nombre,
      lastName: row.Apellidos,
      idNumber: row.IdEmpleado,
      email: row["CorreoElectrónico"],
      charge: row.Cargo,
    };
  };
  const itemsToAdd = await fromCsvToJson(fileName, functionPush, []);
  const plant = await Plant.findOne({ name: "SAN NICOLAS" }).lean().exec();
  for await (let element of itemsToAdd) {
    const user = await Users.findOne({ idNumber: element.idNumber });
    if (user) {
      const message = "El usuario ya existe en base de datos";
      collectError(
        results.errors,
        message,
        item,
        element.name + " " + element.lastName
      );
    } else {
      var name = "";
      element.name
        ? element.name.split(" ").map((e) => {
            if (e.length > 0) {
              if (name) {
                name =
                  name + " " + e[0].toUpperCase() + e.slice(1).toLowerCase();
              } else {
                name = e[0].toUpperCase() + e.slice(1).toLowerCase();
              }
            }
          })
        : (name = "Xx");

      const lastName = element.lastName
        ? element.lastName.split(" ")[0][0].toUpperCase() +
          element.lastName.split(" ")[0].slice(1).toLowerCase()
        : "Xx";
      const newItem = await Users({
        username:
          (element.name ? element.name.split(" ")[0][0].toLowerCase() : "XX") +
          element.lastName.toLowerCase().split(" ")[0],
        name: name + " " + lastName,
        idNumber: parseInt(element.idNumber),
        email: element.email ? element.email : "",
        phone: element.phone ? element.phone : "",
        access: access[element.charge],
        charge: charges[element.charge],
        plant: plant._id,
        active: true,
      });
      await newItem.save();
      results.ok.push(newItem.name);
    }
  }
  return finalResults(item, results);
}

async function loadOTfromCsv() {
  const fileName = "OT.csv",
    item = "OT";
  const results = { ok: [], errors: [] };
  const functionPush = (row) => {
    return {
      code: row.Nro_OT,
      device: row.Equipo.toUpperCase(),
      servicePoint: row["Lugar de Servicio"],
      status: row.Status,
      class: row.Clase,
      initIssue: row.Problema_Tipo,
      solicitorName: row.Solicitante,
      solicitorTel: row.Telefono,
      otSiderar: row.OT_Siderar,
      supervisor: row.Supervisor,
      requestDate: row['Fecha_Emisión'],
      requestUser: row.Usuario_Alta,
      description: row.Causa_Problematica,
      cause: row["Clasificación_de_Causa"],
      closeUser: row.Usuario_Cierre,
      closeDate: row.Momento_Cierre,
    };
  };
  const itemsToAdd = await fromCsvToJson(fileName, functionPush, []);
  // itemsToAdd.splice(30)
  const helpDesk = await Users.findOne({ username: "mayuda" });
  const options = await WOoptions.findOne({ name: "Work Orders Options" });

  let altDevice = null;
  let altSP = null;
  for await (let element of itemsToAdd) {
    try {
      console.log("OT:", element.code);
      const ot = await WorkOrder.findOne({ code: element.code });
      if (ot) {
        const message = "Ese número de OT ya fue cargado";
        collectError(results.errors, message, item, element.code);
      } else {
        const servicePoint = await ServicePoint.findOne({
          code: element.servicePoint,
        });
        const device = await Device.findOne({ code: element.device });
        if (!device && !servicePoint) {
          const message = "OT sin Equipo ni Lugar de Servicio asignado";
          collectError(results.errors, message, item, element.code);
        } else {
          if (!device) altDevice = await Device.findOne({
              servicepoint: [{ _id: servicePoint._id }],
            });
          if (!servicePoint)altSP = await ServicePoint.findOne({
              devices: { _id: device._id },
            });
          const closeUser = await Users.findOne({ username: element.closeUser });
          const supervisor = await Users.findOne({
            idNumber: element.supervisor == 9 ? 26503140 : element.supervisor,
          });
          const regUser = await Users.findOne({ username: element.requestUser });

          const newItem = await WorkOrder({
            code: element.code,
            device: device ? device._id : altDevice._id,
            servicePoint: servicePoint ? servicePoint._id : altSP._id,
            status: OTstatus[element.status],
            class: OTclass[element.class],
            initIssue: tipoProb[element.initIssue],
            solicitor: {
              name: element.solicitorName,
              phone: element.solicitorTel,
            },
            registration:{
              date: getDate(element.requestDate),
              user: regUser?regUser._id:helpDesk._id
            },
            clientWO: element.otSiderar,
            supervisor: supervisor._id,
            description: element.description,
            cause: Object.keys(OTCause).includes(element.cause)
              ? options.causes.find(
                  (e) => e.name === OTCause[element.cause].name
                ).name
              : null,
            closed: element.closeDate ? {date: getDate(element.closeDate), user: closeUser?closeUser._id:helpDesk._id} : null,
          });
          altDevice = null;
          altSP = null;
          await newItem.save();
          results.ok.push(newItem.code);
        }
      }
    } catch (e) {
      collectError(results.errors, e.message, item, element.code);
    }
  }
  return finalResults(item, results);
}

module.exports = {
  createWOoptions,
  createUserOptions,
  createUsers,
  loadOTfromCsv,
};
