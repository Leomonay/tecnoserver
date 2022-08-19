const mongoose = require("mongoose");
const Plant = require("../models/Plant");
const Area = require("../models/Area");
const Line = require("../models/Line");
const Refrigerante = require("../models/Refrigerant");
const Options = require("../models/DeviceOptions");
const Device = require("../models/Device");
const ServicePoint = require("../models/ServicePoint");
const {
  fromCsvToJson,
  collectError,
  finalResults,
  getDate,
} = require("../utils/utils");

const { deleteArea } = require("../controllers/areaController");
const Intervention = require("../models/Intervention");
const WorkOrder = require("../models/WorkOrder");
const User = require("../models/User");
const { setPassword } = require("../controllers/userController");

//******************** ÚTILES PARA CARGAS *******************************************//

const deviceOptions = {
  units: ["Kcal", "Tn"],
  tipo: [
    "Genérica",
    "Autocontenido Condensado por Agua",
    "Autocontenido Condensado por Aire",
    "Automotor",
    "GR",
    "Bomba de agua",
    "Caldera",
    "Calefactor",
    "Cámara",
    "Compacto/Ventana",
    "Compresor",
    "Daikin",
    "Enfriador de agua",
    "Enfriador Especial",
    "Extractor de Aire",
    "Fan Coil",
    "FH4",
    "Freezer",
    "Heladera",
    "Lintern C.A.",
    "Lintern C.C.",
    "Mochila TECNO",
    "Portátil",
    "Mochila Rittal",
    "Roof Top",
    "Secador de Aire",
    "Separado",
    "Simil Dencomiler",
    "Split",
    "Tecno",
    "Termotanque",
    "Tornillo",
    "VRV",
    "Móvil",
    "FK5",
    "Bomba de agua",
    "Torre de enfriamiento",
    "Tecno C.C.",
    "TECNO Split",
    "Westric",
    "Split Westric",
  ],
  servicio: [
    "OP-GRUA",
    "SALA ELECTRICA",
    "OPERATIVO",
    "OFICINAS",
    "COMEDOR",
    "VESTUARIO",
    "OTRO",
  ],
  estado: ["BUENO", "REGULAR", "MALO"],
  categoria: [
    "Automotores",
    "Bombas",
    "Carros",
    "Comedores",
    "Equipos Menores",
    "Gruas C.A.",
    "Gruas C.C.",
    "Maquinas Pesadas",
    "Púlpitos",
    "Salas Eléctricas",
    "Terminales",
  ],
  ambiente: [
    "ACERIA",
    "CALORIA",
    "COQUERIA",
    "NORMAL",
    "Polución+Caloría",
    "Polución",
    "TAREA PELIGROSA",
  ],
  convert: {
    servicio: function (code) {
      const refer = {
        COM: "COMEDOR",
        G: "OP-GRUA",
        OF: "OFICINA",
        OT: "OTRO",
        P: "PULPITO",
        SE: "SALA ELECTRICA",
        VES: "VESTUARIO",
      };
      return refer[code];
    },
    estado: function (code) {
      const refer = {
        BIEN: "BUENO",
        BUENO: "BUENO",
        REGULAR: "REGULAR",
        MAL: "MALO",
      };
      return refer[code];
    },
    categoria: function (code) {
      const refer = {
        AU: "Automotores",
        BO: "Bombas",
        CA: "Carros",
        CO: "Comedores",
        EM: "Equipos Menores",
        GA: "Gruas C.A.",
        GC: "Gruas C.C.",
        MP: "Maquinas Pesadas",
        PU: "Púlpitos",
        SE: "Salas Eléctricas",
        TE: "Terminales",
      };
      return refer[code];
    },
    categoria: function (code) {
      const refer = {
        AU: "Automotores",
        BO: "Bombas",
        CA: "Carros",
        CO: "Comedores",
        EM: "Equipos Menores",
        GA: "Gruas C.A.",
        GC: "Gruas C.C.",
        MP: "Maquinas Pesadas",
        PU: "Púlpitos",
        SE: "Salas Eléctricas",
        TE: "Terminales",
      };
      return refer[code];
    },
    ambiente: function (code) {
      const refer = {
        AC: "ACERIA",
        CA: "CALORIA",
        CO: "COQUERIA",
        NO: "NORMAL",
        PC: "Polución + Caloría",
        PO: "Polución",
        TP: "TAREA PELIGROSA",
      };
      return refer[code];
    },
    tipo: function (code) {
      const refer = {
        E00: "Generica",
        E01: "Autocontenido Cond. X Agua",
        E02: "Autocontenido Cond. X Aire",
        E03: "Automotor",
        E04: "GR",
        E05: "Bombas de Agua",
        E06: "Caldera",
        E07: "Calefactores",
        E08: "Camara",
        E09: "Compacto",
        E10: "Compresor",
        E11: "Daikin",
        E12: "Enfriador de Agua",
        E13: "Enfriador Especial",
        E14: "Extractor de Aire",
        E15: "Fan Coil",
        E16: "FH4",
        E17: "Freezer",
        E18: "Heladera",
        E19: "Linter CA",
        E20: "Linter CC",
        E21: "Mochila TECNO",
        E22: "Portatil",
        E23: "Mochila RITTAL",
        E24: "Roof Top",
        E25: "Secador de Aire",
        E26: "Separado",
        E27: "Simil Dencomiler",
        E28: "Split",
        E29: "Tecno",
        E30: "Termotanque",
        E31: "Tornillo",
        E32: "VRV",
        E33: "Movil",
        E34: "FK5",
        E35: "Bomba",
        E36: "Torre",
        E38: "Tecno CC",
        E39: "Tecno-Split",
        E40: "WESTRIC",
        E41: "SPLIT WESTRIC",
      };
      return refer[code];
    },
  },
};

//******************** CARGAR AREAS *******************************************//

async function loadAreasFromCsv() {
  const fileName = "Áreas.csv",
    item = "Areas";
  const results = { ok: [], errors: [] };
  const functionPush = (row) => {
    return { name: row.Area, code: row.Codigo, parentCode: row.Planta };
  };
  const itemsToAdd = await fromCsvToJson(fileName, functionPush, []);
  for await (let element of itemsToAdd) {
    const plant = await Plant.findOne({ code: element.parentCode });
    if (!plant) {
      const message = "La planta no existe en base de datos";
      collectError(results.errors, message, item, element.name);
    } else {
      if (await Area.findOne({ name: element.name })) {
        const message = "El área ya existe en base de datos";
        collectError(results.errors, message, item, element.name);
      } else {
        const area = await Area({ code: element.code, name: element.name });
        const storedArea = await area.save();
        await plant.areas.push(mongoose.Types.ObjectId(storedArea._id));
        await plant.save();
        results.ok.push(element.name);
      }
    }
  }
  return finalResults(item, results);
}

//******************** CARGAR LINEAS *******************************************//

async function loadLinesFromCsv() {
  const fileName = "Líneas.csv",
    item = "Líneas";
  const results = { ok: [], errors: [] };
  const functionPush = (row) => {
    return { name: row.Linea, code: row.Cod_Linea, parentCode: row.Area };
  };
  const itemsToAdd = await fromCsvToJson(fileName, functionPush, []);
  for await (let element of itemsToAdd) {
    const area = await Area.findOne({ code: element.parentCode });
    if (!area) {
      const message = "El área no existe en base de datos";
      collectError(results.errors, message, item, element.name);
    } else {
      if (await Line.findOne({ name: element.name })) {
        const message = "La línea ya existe en base de datos";
        collectError(results.errors, message, item, element.name);
        //                errorItems.push({linea: element.name, error: })
      } else {
        const line = await Line({ name: element.name, code: element.code });
        const lineStored = await line.save();
        await area.lines.push(mongoose.Types.ObjectId(lineStored._id));
        await area.save();
        results.ok.push(element.name);
      }
    }
  }
  const areasSinLineas = await Area.find({
    lines: { $exists: true, $size: 0 },
  });
  for await (let area of areasSinLineas.map((e) => e.name)) {
    await deleteArea(area);
    results.errors.Area
      ? results.errors.Areas.push(area)
      : results.errors.push({
          error: "Area borrada por no tener linea asignada",
          Areas: [area],
        });
  }
  return finalResults(item, results);
}
//*********** CARGAR LUGARES DE SERVICIO ***************************************/

async function loadServicePointsFromCsv() {
  const fileName = "Lugar_de_Servicio.csv";
  const item = "Lugares de Servicio";
  const results = { ok: [], errors: [] };
  let i = 1;
  try {
    const functionPush = (row) => {
      return {
        code: row.Cod_Lugar_Servicio,
        name: row.Nombre_Lugar_Sercio,
        parentCode: row["Línea"],
        gate: row["Portón"],
        insalubrity: row.Insalubridad,
        steelMine: row["Acería"],
        calory: row["Caloría"],
        dangerTask: row.Tarea_Peligrosa,
      };
    };
    const itemsToAdd = await fromCsvToJson(fileName, functionPush, []);
    for await (let element of itemsToAdd) {
      const parent = await Line.findOne({ code: element.parentCode });
      if (!parent) {
        const message = "La línea no existe en base de datos";
        collectError(results.errors, message, item, element.name);
      } else {
        if (await ServicePoint.findOne({ code: element.code })) {
          const message = "El lugar de Servicio ya existe en base de datos";
          collectError(results.errors, message, item, element.name);
        } else {
          const newItem = await ServicePoint({
            code: element.code,
            name: element.name,
            gate: element.gate,
            insalubrity: element.insalubridad,
            steelMine: element.aceria,
            calory: element.caloria,
            dangerTask: element.tareaPeligrosa,
          });
          const storedItem = await newItem.save();
          await parent.ServicePoints.push(
            mongoose.Types.ObjectId(storedItem._id)
          );
          await parent.save();
          results.ok.push(element.name);
          i++;
        }
      }
    }
  } catch (e) {
    results.errors.push({ error: { proceso: e.message }, orden: i });
  }
  return finalResults(item, results);
}

//******************** CARGAR GASES *******************************************//

async function loadGasesFromCsv() {
  const item = "Refrigerantes";
  const results = { ok: [], errors: [] };
  const fileName = "Gases.csv";
  const functionPush = (row) => {
    return { name: row.Gas, code: row.Cod_Gas };
  };
  try {
    const itemsToAdd = await fromCsvToJson(fileName, functionPush, []);
    for await (let element of itemsToAdd) {
      if (await Refrigerante.findOne({ refrigerante: element.name })) {
        const message = "El gas ya existe en base de datos";
        collectError(results.errors, message, item, element.name);
      } else {
        const item = await Refrigerante({
          refrigerante: element.name,
          code: element.code,
        });
        await item.save();
        results.ok.push(element.name);
      }
    }
  } catch (e) {
    results.errors.push({ proceso: e.message });
  }
  return finalResults(item, results);
}

//******************** CARGAR OPCIONES DE EQUIPO *******************************************//

async function createDeviceOptions() {
  try {
    const Opciones = await Options({
      name: "DeviceFeatures",
      types: deviceOptions.tipo,
      units: deviceOptions.units,
      service: deviceOptions.servicio,
      status: deviceOptions.estado,
      category: deviceOptions.categoria,
      environment: deviceOptions.ambiente,
    });
    const savedOptions = await Opciones.save();
    return { ok: { Options: savedOptions } };
  } catch (e) {
    return { error: { proceso: e.message } };
  }
}

//******************** CARGAR EQUIPOS *******************************************//
async function loadDevicesFromCsv() {
  const item = "Equipos";
  const results = { ok: [], errors: [] };
  const fileName = "Equipos.csv";
  try {
    const options = await Options.findOne({ name: "DeviceFeatures" })
      .lean()
      .exec();
    const correctCodes = function (code) {
      const ref = {
        "LAQ-LS005": "LAQ-032",
        "LAQ-LS008": "LAQ-033",
        "LSQ-LS009": "LAQ-033",
      };
      if (Object.keys(ref).includes(code)) {
        return ref[code];
      } else {
        return code;
      }
    };
    const setLocation = async function (code, line) {
      code == "LSQ-LS009" ? (deviceCode = "LAQ-LS009") : (deviceCode = code);
      var lineOk = await Line.findOne({ name: line });
      if (!lineOk) {
        lineOk = await Line.findOne({ code: deviceCode.split("-")[0] });
      }
      return lineOk._id;
    };
    const functionPush = (row) => {
      return {
        code: row.Equipo_id,
        name: row.Denominacion,
        type: row["Tipo Equipo"],
        potenciaKcal: row["Pot Calor Kcal"],
        potenciaTn: row["Pot Frio Tn"],
        gas: row.Gas_que_utiliza,
        criticidad: row.Criticidad,
        estado: row.Status,
        infoExtra: row["Descripción Larga"],
        servicio: row.Servicio,
        categoria: row.Categoria,
        alta: row.Fecha_Alta,
        ambiente: row.Contexto,
        ubicacion: row.Ubicación_Linea,
        activo: row.Activo,
      };
    };
    const itemsToAdd = await fromCsvToJson(fileName, functionPush, []);
    // itemsToAdd.splice(2)
    for await (elem of itemsToAdd) {
      if (await Device.findOne({ code: elem.code })) {
        const message = "El equipo ya existe en base de datos";
        collectError(results.errors, message, item, elem.name);
      } else {
        const newDevice = await Device({
          code: correctCodes(elem.code),
          name: elem.name,
          type: deviceOptions.convert.tipo(elem.type),
          power: {
            magnitude:
              elem.potenciaKcal == ""
                ? ""
                : parseInt(elem.potenciaKcal.split(",")[0].replace(".", "")),
            unit: elem.potenciaKcal == "" ? "" : options.units[0],
          },
          refrigerant:
            elem.gas === ""
              ? null
              : (
                  await Refrigerante.findOne({ code: elem.gas })
                )._id,
          status:
            elem.estado == "" ? "" : deviceOptions.convert.estado(elem.estado),
          extraDetails: elem.infoExtra,
          service:
            elem.servicio == ""
              ? ""
              : deviceOptions.convert.servicio(elem.servicio),
          category:
            elem.categoria == ""
              ? ""
              : deviceOptions.convert.categoria(elem.categoria),
          regDate: elem.alta == "" ? "" : getDate(elem.alta),
          environment: deviceOptions.convert.ambiente(elem.ambiente),
          line: await setLocation(elem.code, elem.ubicacion),
          active: true,
        });
        newDevice.save();
        results.ok.push(elem.name);
      }
    }
  } catch (e) {
    return { error: { proceso: e.message } };
  }
  return finalResults(item, results);
}

//******************** CARGAR RELACION EQ-LS *******************************************//
async function loadRelationEqLsFromCsv() {
  const fileName = "Relacion_Equipo_Lugar_Servicio.csv",
    item = "Relaciones EQ-LS";
  const results = { ok: [], errors: [] };
  var relLog = [];
  const functionPush = (row) => {
    return { deviceCode: row.Equipo, spCode: row["Lugar de Servicio"] };
  };
  const itemsToAdd = await fromCsvToJson(fileName, functionPush, []);
  // itemsToAdd.splice(2)
  for await (let element of itemsToAdd) {
    const relName = `[${element.deviceCode} - ${element.spCode}]`;
    const deviceFound = await Device.findOne({ code: element.deviceCode });
    const servPoint = await ServicePoint.findOne({ code: element.spCode });
    let message = "";
    if (!deviceFound || !servPoint) {
      deviceFound && !servPoint
        ? (message = `Existe el Equipo, pero no el LS`)
        : () => {};
      !deviceFound && !servPoint
        ? (message = `No existen Equipo ni LS`)
        : () => {};
      !deviceFound && servPoint
        ? (message = `Existe el LS, pero no el Equipo`)
        : () => {};
      collectError(results.errors, message, item, relName);
    } else if (relLog.includes(relName)) {
      message = "Relación EQ-LS YA REGISTRADA";
      collectError(results.errors, message, item, relName);
    } else {
      deviceFound.servicePoints.push(mongoose.Types.ObjectId(servPoint._id));
      servPoint.devices.push(mongoose.Types.ObjectId(deviceFound._id));
      await deviceFound.save();
      await servPoint.save();
      results.ok.push(relName);
    }
  }
  return finalResults(item, results);
}

async function updateData() {
  // edit this for extra manipulation or errors as need.

  const devices = await Device.find({});
  results = { success: [], errors: [] };
  try {
    for await (let device of devices) {
      if ((device.power && device.power.magnitude) || device.power.unit)
        await Device.updateOne(
          { _id: device._id },
          { powerKcal: device.power.magnitude }
        );
    }
    results.success.push({ powerKcal: "success" });
  } catch (e) {
    results.errors.push({ powerKcal: e.message });
    console.log(e.message);
  }

  try {
    await Device.updateMany({}, { $unset: power });
    results.success.push({ removePower: "success" });
  } catch (e) {
    results.errors.push({ removePower: e.message });
  }
  const servicePoints = await ServicePoint.find({});
  try {
    await Promise.all(
      servicePoints.map(async (sp) => {
        await ServicePoint.updateOne(
          { _id: sp._id },
          {
            insalubrity: sp.insalubridad || false,
            steelMine: sp.aceria || false,
            calory: sp.caloria || false,
            dangerTask: sp.tareaPeligrosa || false,
          }
        );
      })
    );
    results.success.push({ moveToAdditionalsInEnglish: "success" });
  } catch (e) {
    console.log(e.message);
    results.errors.push({ moveToAdditionalsInEnglish: e.message });
  }

  try {
    await Promise.all(
      servicePoints.map(async (sp) => {
        await ServicePoint.updateOne(
          { _id: sp._id },
          {
            $unset: { insalubridad, aceria, tareaPeligrosa, caloria },
          }
        );
      })
    );
    results.success.push({ removingSpanishAdditionals: "success" });
  } catch (e) {
    console.log(e.message);
    results.errors.push({ removingSpanishAdditionals: e.message });
  }

  return results;
}

module.exports = {
  collectError,
  fromCsvToJson,
  finalResults,
  loadAreasFromCsv,
  loadLinesFromCsv,
  loadGasesFromCsv,
  createDeviceOptions,
  loadDevicesFromCsv,
  loadServicePointsFromCsv,
  loadRelationEqLsFromCsv,
  updateData,
};
