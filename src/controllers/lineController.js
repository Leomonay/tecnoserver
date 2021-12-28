const Line = require("../models/Line");
const Area = require("../models/Area");
// const {index} = require ('../utils/tablesIndex.js')
// const {addItem} = require ('../utils/utils.js')
const mongoose = require("mongoose");

async function checkLine(lineName) {
  return line.check(lineName);
}

async function getLines(req, res) {
  const lines = await Line.find().lean().exec();
  res.status(200).send({ lines: lines.map((e) => [e.name, e.area.name]) });
}

async function addLineFromApp(req, res) {
  const { lines, areaCode } = req.body;
  let results = [];
  for (let line of lines) {
    const result = await addLine(line.name, line.code, areaCode);
    results = [...results, result];
  }
  res.status(200).send(results);
}

async function addLine(lineName, lineCode, areaCode) {
  try {
    const line = await Line({
      name: lineName,
      code: lineCode,
    });
    const lineStored = await line.save();
    const area = await Area.findOne({ code: areaCode });
    await area.lines.push(mongoose.Types.ObjectId(lineStored._id));
    await area.save();
    return { success: true, line: lineStored };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function deleteLine(lineName) {
  try {
    const line = await Line.findOne({ name: lineName });
    const area = await Area.findOne({ lines: line._id });
    await area.lines.pull(line._id);
    await area.save();
    await Line.deleteOne({ name: lineName });
    return { success: true, name: lineName };
  } catch (e) {
    return { success: false, name: lineName, error: e.message };
  }
}

async function deleteOneLine(req, res) {
  const lineName = req.body.name;
  let response = await deleteLine(lineName);
  if (response.success) res.status(201).send({ response });
}

async function getLineByName(req, res) {
    let { name } = req.params;
    let line = await Line.findOne({ name: name });
  let result = { name: line.name, code: line.code };
  res.status(200).send(result);
}

async function updateLine(req, res) {
  try {
    const { newName, newCode, oldName, oldCode } = req.body;
    const checkLine = await Line.find({ name: oldName }).lean().exec();
    if (checkLine.length > 0) {
      const lineUpdated = await Line.updateOne(
        { name: oldName },
        { name: newName, code: newCode }
      );
      res.status(201).send({ lineUpdated });
    } else {
      res.status(400).send({ message: "El área no existe" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
}

module.exports = {
  getLines,
  checkLine,
  addLineFromApp,
  deleteOneLine,
  getLineByName,
  updateLine,
};
