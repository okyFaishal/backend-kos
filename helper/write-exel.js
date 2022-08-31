const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

function toExcel (fileName1, result){
  // console.log(json)
  console.log(fileName1)
  const fileName = "payment";
  let wb = XLSX.utils.book_new();
  wb.Props = {
    Title: fileName,
    Author: "pero",
    CreatedDate: new Date(),
  };
  // Buat Sheet
  wb.SheetNames.push("Sheet 1");
  // Buat Sheet dengan Data
  let ws = XLSX.utils.json_to_sheet(result);
  wb.Sheets["Sheet 1"] = ws;
  // Cek apakah folder downloadnya ada
  const downloadFolder = path.resolve(__dirname, "../asset/downloads");
  console.log('downloadFolder')
  console.log(downloadFolder)
  console.log('path.sep')
  console.log(path.sep)
  console.log("`${downloadFolder}${path.sep}${fileName}.xls`")
  console.log(`${downloadFolder}${path.sep}${fileName}.xls`)
  if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
  }
  XLSX.writeFile(wb, `${downloadFolder}${path.sep}${fileName}.xls`);
  return `${downloadFolder}${path.sep}${fileName}.xls`
  // try {    
  // } catch (error) {
  //   console.log(error)
  //   return {status:false, error}
  // }
}

module.exports = toExcel