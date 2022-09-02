const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

function toExcel (fileName, result){
  try {    
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
    if (!fs.existsSync(downloadFolder)) {
      fs.mkdirSync(downloadFolder);
    }
    XLSX.writeFile(wb, `${downloadFolder}${path.sep}${fileName}.xls`);
    return {status: true, data:`${downloadFolder}${path.sep}${fileName}.xls`}
  } catch (error) {
    console.log(error)
    return {status:false, data: error}
  }
}

module.exports = toExcel