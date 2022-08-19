const Plant = require("../models/Plant");
const Strategy = require("../models/Strategy");
const Task = require("../models/Task");
const TaskDate = require("../models/TaskDates");
const Device = require("../models/Device");
const User = require("../models/User");
const WorkOrder = require("../models/WorkOrder");

function buildDate(date) {
  return {
    id: date._id,
    plant: plantName,
    area: date.task.device.line.area.name,
    line: date.task.device.line.name,
    code: date.task.device.code,
    device: date.task.device.name,
    date: new Date(date.date),
    strategy: date.task.strategy.name,
    responsible: date.task.responsible
      ? { id: date.task.responsible.idNumber, name: date.task.responsible.name }
      : undefined,
    supervisor: {
      id: date.task.strategy.supervisor.idNumber,
      name: date.task.strategy.supervisor.name,
    },
    observations: date.task.observations,
    completed: date.workOrders[0]
      ? date.workOrders.map((ot) => ot.completed).reduce((a, b) => a + b, 0) /
        date.workOrders.length
      : 0,
  };
}

async function getDates(req, res) {
  try {
    const { year } = req.query;
    const plant = await Plant.find(
      req.query.plant ? { name: req.query.plant } : {}
    );
    const strategies = await Strategy.find({
      year,
      plant: plant.map((plant) => plant._id),
    }).populate({ path: "plant", select: "name" });
    const tasks = await Task.find({ strategy: strategies.map((s) => s._id) })
      .populate("device")
      .populate("strategy")
      .populate("responsible");
    const dates = await TaskDate.find({ task: tasks.map((task) => task._id) })
      .populate({ path: "task", populate: { path: "device", select: "code" } })
      .populate({ path: "workOrders", select: "code" });
    let deviceList = [];
    for (let task of tasks) {
      const { code, name } = task.device;
      let deviceTask = { code, name };
      deviceTask.strategy = task.strategy.name;
      deviceTask.responsible = task.responsible
        ? { id: task.responsible.idNumber, name: task.responsible.name }
        : "Sin Asignar";
      deviceTask.frequency = task.frequency;
      deviceTask.dates = dates
        .filter((date) => date.task.device.code === task.device.code)
        .map((element) => ({
          date: element.date,
          orders: element.workOrders.map((order) => order.code),
        }));
      deviceList.push(deviceTask);
    }
    res.status(200).send(deviceList);
  } catch (e) {
    console.log(e);
    res.status(400).send({ error: e.message });
  }
}

async function addDates(req, res) {
  try {
    const { year, dates } = req.body;
    const device = await Device.findOne({ code: req.body.device }).populate({
      path: "line",
      select: "name",
      populate: {
        path: "area",
        select: "name",
        populate: { path: "plant", select: "name" },
      },
    });
    const plant = await Plant.findOne({ name: device.line.area.plant.name });
    const strategy = await Strategy.findOne({
      plant: plant._id,
      year,
      name: req.body.strategy,
    });
    const task = await Task.findOne({
      strategy: strategy._id,
      device: device._id,
    });

    await TaskDate.deleteMany({ task: task._id, workOrders: [] });
    const currentDates = await TaskDate.find({ task: task._id });

    dateList = [];

    for await (let date of dates) {
      if (!currentDates.find((item) => item.date.toISOString() === date.date)) {
        const newDate = await TaskDate({
          task: task._id,
          date: new Date(date.date),
          completed: 0,
          workOrders: (
            await WorkOrder.find({ code: date.orders })
          ).map((order) => order._id),
        });
        await newDate.save();
        dateList.push(newDate);
      }
    }
    res.status(200).send(dateList);
  } catch (e) {
    console.log(e);
    res.status(400).send({ error: e.message });
  }
}

async function getPlan(req, res) {
  try {
    const year = Number(req.query.year);
    const plantName = req.query.plant;
    const user = await User.findOne({ username: req.query.user });
    const plant = await Plant.find(plantName ? { name: plantName } : {});
    const strategies = await Strategy.find({
      year,
      plant: plant.map((plant) => plant._id),
    });
    const tasks = await Task.find({ strategy: strategies.map((s) => s._id) });
    const dates = await TaskDate.find({
      task: tasks.map((task) => task._id),
    }).populate([
      {
        path: "task",
        populate: [
          {
            path: "responsible",
            select: ["idNumber", "name"],
          },
          {
            path: "device",
            select: ["code", "name"],
            populate: {
              path: "line",
              select: "name",
              populate: {
                path: "area",
                select: "name",
              },
            },
          },
          {
            path: "strategy",
            populate: { path: "supervisor", select: ["idNumber", "name"] },
          },
        ],
      },
      {
        path: "workOrders",
        select: ["code", "completed"],
      },
    ]);
    let plan = [];
    for (let date of dates) {
      if (
        user &&
        !(
          (user.access === "Worker" &&
            date.task.responsible.idNumber !== user.idNumber) ||
          (user.access === "Supervisor" &&
            date.task.strategy.supervisor.idNumber !== user.idNumber)
        )
      )
        plan.push({
          id: date._id,
          plant: plantName,
          area: date.task.device.line.area.name,
          line: date.task.device.line.name,
          code: date.task.device.code,
          device: date.task.device.name,
          date: new Date(date.date),
          strategy: date.task.strategy.name,
          responsible: date.task.responsible
            ? {
                id: date.task.responsible.idNumber,
                name: date.task.responsible.name,
              }
            : undefined,
          supervisor: {
            id: date.task.strategy.supervisor.idNumber,
            name: date.task.strategy.supervisor.name,
          },
          observations: date.task.observations,
          completed: date.workOrders[0]
            ? date.workOrders
                .map((ot) => ot.completed)
                .reduce((a, b) => a + b, 0) / date.workOrders.length
            : 0,
          workOrders: date.workOrders.map((order) => order.code),
        });
    }

    res.status(200).send(plan.sort((a, b) => (a.date > b.date ? 1 : -1)));
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

module.exports = {
  getDates,
  addDates,
  getPlan,
};
