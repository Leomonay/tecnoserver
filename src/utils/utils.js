const csv = require("fast-csv");
const fs = require("mz/fs");

async function fromCsvToJson(filename, functionPush, type) {
    let toAdd = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(__dirname + "/../../../tablas_en_csv/" + filename)
        .pipe(csv.parse({ headers: true, delimiter: ";" }))
        .on("error", (error) => {
          console.error(error);
          reject(error);
        })
        .on("data", async (row) => toAdd.push(functionPush(row)))
        .on("end", async () => {
          resolve(toAdd);
        });
    });
  }
  
  function objectFromArrays(keys, values) {
    var entries = [];
    for (i = 0; i < keys.length; i++) {
      entries.push([keys[i], values[i]]);
    }
    var obj = Object.fromEntries(new Map(entries));
    return obj;
  }

  function collectError(errorItems, message, item, name) {
    errorItems.find((e) => e.error === message)
      ? errorItems.find((e) => e.error === message)[item].push(name)
      : errorItems.push(objectFromArrays(["error", item], [message, [name]]));
  }

  function finalResults(item, results) {
    return {
      item: item.toUpperCase(),
      OK: objectFromArrays(["cantidad", item], [results.ok.length, results.ok]),
      errores: { cantidad: results.errors.length, detalle: results.errors },
    };
  }

  function getDate (date) {
    var arrayDate = date.split(" ")[0].split("/");
    return new Date(arrayDate[2], arrayDate[1]-1, arrayDate[0]);
  };

  module.exports = {fromCsvToJson, objectFromArrays, collectError, finalResults, getDate}
