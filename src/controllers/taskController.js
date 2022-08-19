const User = require("../models/User");
const Plant = require("../models/Plant");
const Device = require("../models/Device");
const Strategy = require("../models/Strategy");
const Task = require("../models/Task");
const WorkOrder = require("../models/WorkOrder");
const TaskDates = require("../models/TaskDates");

async function setTasks(req, res) {
  let results = { created: [], errors: [] };
  try {
    // get body data
    const { device } = req.body;
    const { year, name, frequency, cost, observations } = req.body.program;
    // build task data
    const data = { year, name, frequency, observations };
    const plant = await Plant.findOne({ name: req.body.program.plant });
    const strategies = (await Strategy.find({ year, plant: plant._id })).map(
      (strategy) => strategy._id
    );
    const newStrategy = (
      await Strategy.findOne({ year, plant: plant._id, name })
    )._id;
    const responsible = req.body.program.responsible
      ? await User.findOne({ idNumber: req.body.program.responsible.id })
      : undefined;
    data.cost = cost || 0;
    data.plant = plant._id;
    data.strategy = newStrategy;
    data.responsible = responsible && responsible._id;

    // create or update data for devices
    const devices = await Device.find({ code: device });

    try {
      for await (let device of devices) {
        //search tasks already assigned to device this year
        const currentTasks = await Task.find({
          device: device._id,
          strategy: strategies,
        });
        //select all dates which are already related to workOrders
        const dates = await TaskDates.find({
          task: currentTasks.map((t) => t._id),
        }).populate("workOrders");
        //make an array with all non repeated dates
        const datesKept = [
          ...new Set(
            dates
              .filter((date) => !!date.workOrders[0])
              .map((date) => date.date)
          ),
        ];
        //search and update or create the task.
        let assignedTask = currentTasks.find(
          (task) => task.strategy === newStrategy
        );
        if (!assignedTask) {
          const task = await Task({ device: device._id, ...data });
          assignedTask = await task.save();
        } else {
          assignedTask = await Task.findByIdAndUpdate(assignedTask._id, data);
        }
        //add already related dates to the task
        for await (let date of datesKept) {
          let ordersArray = [];
          for (let taskDate of dates.filter(
            (item) =>
              new Date(item.date).toISOString() === new Date(date).toISOString()
          )) {
            for (let order of taskDate.workOrders) {
              if (!ordersArray.map((order) => order.code).includes(order.code))
                ordersArray.push(order);
            }
          }
          const newTaskDate = await TaskDates({
            task: assignedTask._id,
            date: date,
            workOrders: ordersArray.map((order) => order._id),
          });
          await newTaskDate.save();
        }
        //delete all possible dates from other tasks.
        await TaskDates.deleteMany({ _id: dates.map((e) => e._id) });
        //delete all possible tasks which where assigned from other strategies.
        await Task.deleteMany({
          device: device._id,
          _id: { $ne: assignedTask._id },
        });
        results.created.push(device.code);
      }
    } catch (e) {
      console.log(e);
      results.errors.push({
        code: device.code,
        name: device.name,
        error: e.message,
      });
    }
    results.created = {
      device: results.created,
      strategy: {
        ...data,
        plant: plant.name,
        responsible: responsible
          ? { id: responsible.idNumber, name: responsible.name }
          : undefined,
      },
    };
    res.status(200).send(results);
  } catch (e) {
    console.log(e);
    res.status(400).send({ error: e.message });
  }
}

async function taskOrders(req, res) {
  const { order, date } = req.body;
  try {
    const workOrder = await WorkOrder.findOne({ code: order });

    await TaskDates.updateMany(
      { workOrders: workOrder._id },
      { $pull: { workOrders: workOrder._id } }
    );

    if (date) {
      const taskDate = await TaskDates.findById(date).populate({
        path: "workOrders",
        select: "code",
      });
      if (
        !taskDate.workOrders.map((date) => date.code).includes(workOrder.code)
      ) {
        await TaskDates.findByIdAndUpdate(date, {
          $push: { workOrders: workOrder._id },
        });
        res.status(200).send(`date ${date} updated`);
      } else {
        res.status(200).send(`date already contains workOrder`);
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).send({ error: e.message });
  }
}

async function taskDeviceList(req, res) {
  try {
    const { plantName, year } = req.query;
    //taskList
    const dBPlant = await Plant.find(plantName ? { name: plantName } : {});
    const filter = { year };
    const plant = dBPlant[0] ? dBPlant.map((plant) => plant._id) : undefined;
    if (plant) filter.plant = plant;
    const strategy = await Strategy.find(filter);
    const plan = await Task.find({ strategy: strategy.map((e) => e._id) })
      .populate(["device", "responsible"])
      .populate({
        path: "strategy",
        populate: { path: "plant", select: "name" },
      });

    //deviceList
    const planDevices = await Device.find({ active: true })
      .populate({
        path: "line",
        select: ["code", "name"],
        populate: {
          path: "area",
          select: ["code", "name"],
          populate: {
            path: "plant",
            select: "name",
          },
        },
      })
      .populate({ path: "servicePoints", select: "name" })
      .populate({ path: "refrigerant", select: "refrigerante" })
      .populate(["servicePoints", "refrigerant"])
      .lean()
      .exec();

    //reclaimsList
    const today = new Date();
    const reclaimed = await WorkOrder.aggregate([
      {
        $match: {
          $and: [
            { class: "Reclamo" },
            {
              "registration.date": {
                $gte: new Date(`${year - 1 || today.getFullYear() - 1}/01/01`),
                $lte: new Date(`${year - 1 || today.getFullYear() - 1}/12/31`),
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$device",
          reclaims: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "Device",
          localField: "_id",
          foreignField: "code",
          as: "deviceCode",
        },
      },
    ]);

    const deviceList = [];

    for (let device of planDevices) {
      if (
        !plantName ||
        (plantName && device.line.area.plant.name === plantName)
      ) {
        let inReclaimed = reclaimed.find(
          (element) =>
            JSON.stringify(element._id) === JSON.stringify(device._id)
        );
        const task = plan.find((task) => task.device.code === device.code);

        const newDevice = {
          code: device.code,
          name: device.name,
          type: device.type,
          power: device.powerKcal,
          service: device.service,
          status: device.status,
          category: device.category,
          environment: device.environment,
          age:
            new Date().getFullYear() - new Date(device.regDate).getFullYear(),
          line: device.line.name,
          area: device.line.area.name,
          plant: device.line.area.plant.name,
          active: device.active,
          servicePoints: device.servicePoints
            ? device.servicePoints.map((e) => e.name)
            : [],
          refrigerant: device.refrigerant
            ? device.refrigerant.refrigerante || "S/D"
            : "S/D",
          reclaims: inReclaimed ? inReclaimed.reclaims : 0,
        };
        if (task) {
          const plant = task.strategy.plant.name;
          const { year, name } = task.strategy;
          const { frequency, cost, observations } = task;
          const responsible = task.responsible
            ? {
                id: task.responsible.idNumber,
                name: task.responsible.name,
              }
            : undefined;
          newDevice.strategy = {
            ...{
              plant,
              year,
              name,
              frequency,
              cost,
              observations,
              responsible,
            },
          };
        }
        deviceList.push(newDevice);
      }
    }
    res.status(200).send(deviceList);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

module.exports = {
  setTasks,
  taskOrders,
  taskDeviceList,
};
