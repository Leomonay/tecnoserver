const XLSX = require("xlsx");
const mongoose = require("mongoose");
const deviceController = require("../controllers/deviceController");
const Line = require("../models/Line");
const ServicePoint = require("../models/ServicePoint");

async function loadFromExcel(req, res) {
  const { schema, items } = req.body;
  let addedItems = [];

  // const plants = await Plant.find();
  // const areas = await Area.find().populate("plant");
  const lines = await Line.find().populate({
    path: "area",
    populate: { path: "plant" },
  });

  switch (schema) {
    case "Device":
      for await (let item of items) {
        const {
          name,
          type,
          power,
          service,
          category,
          environment,
          status,
          extraDetails,
          refrigerant,
        } = item;
        const line = lines.find(
          (l) =>
            l.name === item.line &&
            l.area.name === item.area &&
            l.area.plant.name === item.plant
        );
        const sp = await ServicePoint.find({ line: line._id }).populate("line");
        const servicePoints = sp.filter((sp) =>
          item.servicePoints.includes(sp.name)
        );
        const newItem = await deviceController.addNew({
          name,
          type,
          power,
          service,
          category,
          environment,
          status,
          regDate: new Date(item.regDate),
          extraDetails,
          refrigerant,
          line,
          servicePoints,
        });
        addedItems.push(newItem);
      }
      break;
    default:
      break;
  }
  res.status(200).send({ success: { items: addedItems } });
  // for await (let item of addedItems)
  //   await deviceController.deleteDevice(item.code);
  // console.log("finished");
}

async function buildExcel(req, res) {
  const modelName = "Device";
  // const modelList = Object.keys(mongoose.models);
  let model = mongoose.models[modelName];
  let fields = Object.keys(model.schema.tree).filter(
    (element) =>
      !["_id", "updatedAt", "createdAt", "id", "__v", "power"].includes(element)
  );

  let element = await model.findOne({}).populate(fields);
  // console.log('tree', model.schema.tree);

  const structure = fields.map((field) => {
    let example = element[field];
    let type = typeof example;
    let shortType = "";
    // console.log(field, type);
    if (type === "object") {
      if (Object.prototype.toString.call(element[field]) === "[object Date]") {
        shortType = "date";
      } else if (
        Object.prototype.toString.call(element[field]) === "[object Array]"
      ) {
        shortType = typeof element[field][0].code + "[]";
        example = element[field].map((e) => e.name);
      } else if (element[field].code) {
        shortType = typeof element[field].code;
        example = element[field].code;
      }
    } else {
      shortType = typeof element[field];
    }

    return [{ [field]: type }, { [field]: example }];
  });

  console.log([structure.map((e) => e[0]), structure.map((e) => e[1])]);
  const ws = XLSX.utils.json_to_sheet(
    [structure.map((e) => e[0]), structure.map((e) => e[1])].flat(1)
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Responses");
  XLSX.writeFile(wb, "sampleData.export.xlsx");

  try {
    // const workSheetsFromBuffer = xlsx.parse(fs.readFileSync(`${__dirname}/myFile.xlsx`));
    res.status(200).send({ success: structure });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

module.exports = {
  loadFromExcel,
  buildExcel,
};
