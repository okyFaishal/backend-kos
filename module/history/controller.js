const { v4: uuid_v4 } = require("uuid");
const sq = require('../../config/connection');
const absensiKaryawan = require('./model');
const karyawan = require('../dataKaryawan/model');
const moment = require('moment');
const csv = require('csvtojson');
const fs = require('fs');
var parser = require('simple-excel-to-json');


class Controller {

    static insert(req, res) {

        if (req.files) {
            let file1 = req.files.file1;
            let filePath = "./asset/file/" + file1.name;

            file1.mv(filePath, async (err) => {
                if (err) {
                    res.json(err);
                } else {
                    // let data = parser.parseXls2Json(filePath);
                    let data = await csv().fromFile(filePath);

                    for (let i = 0; i < data.length; i++) {
                        // data[i].tglAbsenKaryawan = moment(data[i].tglAbsenKaryawan, "YYYY/MM/DD hh:mm:ss").format();
                        data[i].tglAbsenKaryawan = moment(data[i].tglAbsenKaryawan, "MM/DD/YYYY hh:mm:ss ").format();
                        data[i].tgl = moment(data[i].tglAbsenKaryawan).format("YYYY-MM-DD");
                        data[i].jam = moment(data[i].tglAbsenKaryawan).format('HH:mm:ss');
                    }

                    const tmp = [...new Map(data.map(v => [JSON.stringify([v.dataKaryawanId, v.tgl]), v])).values()]
                    let bulk = [];
                    // let isi = "";
                    let isi = `'${tmp[0].dataKaryawanId}'`;

                    for (let j = 0; j < tmp.length; j++) {
                        let min = JSON.parse(JSON.stringify(tmp[j]));
                        let max = JSON.parse(JSON.stringify(tmp[j]));
                        for (let k = 0; k < data.length; k++) {
                            if (tmp[j].dataKaryawanId == data[k].dataKaryawanId) {
                                if (tmp[j].tgl == data[k].tgl) {
                                    if (data[k].jam >= max.jam) {
                                        max["dataKaryawanId"] = data[k].dataKaryawanId;
                                        max["tglAbsenKaryawan"] = data[k].tglAbsenKaryawan;
                                        max["tgl"] = data[k].tgl;
                                        max["jam"] = data[k].jam;
                                    }
                                    if (data[k].jam < min.jam) {
                                        min["dataKaryawanId"] = data[k].dataKaryawanId;
                                        min["tglAbsenKaryawan"] = data[k].tglAbsenKaryawan;
                                        min["tgl"] = data[k].tgl;
                                        min["jam"] = data[k].jam;
                                    }
                                }
                            }
                        }
                        bulk.push(min);
                        bulk.push(max);
                        if (j > 0) {
                            // isi += ` or dk.id = '${tmp[j].dataKaryawanId}'`;
                            isi += `, '${tmp[j].dataKaryawanId}'`;
                        }
                    }

                    // let ms = await sq.query(`select dk.id as "dataKaryawanId",dk."namaKaryawan",dk."masterShiftId",ms."namaShift" from "dataKaryawan" dk join "masterShift" ms on ms.id = dk."masterShiftId" where dk."deletedAt" isnull  and dk.id = '${tmp[0].dataKaryawanId}'${isi}`);
                    let ms = await sq.query(`select dk.id as "dataKaryawanId",dk."namaKaryawan",dk."masterShiftId",ms."namaShift" from "dataKaryawan" dk join "masterShift" ms on ms.id = dk."masterShiftId" where dk."deletedAt" isnull  and dk.id in (${isi})`);
                    let tglB = [];
                    for (let l = 0; l < bulk.length; l++) {
                        // let total = 0;
                        // bulk[l].statusAbsenKaryawan =  0;
                        bulk[l].id = uuid_v4();
                        tglB.push(bulk[l].tglAbsenKaryawan)
                        for (let m = 0; m < ms[0].length; m++) {
                            if (bulk[l].dataKaryawanId == ms[0][m].dataKaryawanId) {
                                bulk[l].ShiftKaryawan = ms[0][m].namaShift;
                            }
                        }
                        // for (let n = 0; n < bulk.length; n++) {
                        //     if(bulk[l].dataKaryawanId == bulk[n].dataKaryawanId && bulk[l].tglAbsenKaryawan == bulk[n].tglAbsenKaryawan){
                        //         total+=1;
                        //     }
                        // } 
                        // if(total>1){
                        //     bulk[l].statusAbsenKaryawan =  3;
                        // }
                    }
                    // console.log(bulk.length);
                    // console.log(bulk);
                    // console.log("=========================");
                    // console.log(tglB);
                    // console.log(isi);
                    // console.log(ms[0]);
                    // fs.unlink(filePath,(err)=>{
                    //     if(err){
                    //         res.json(err);
                    //     }else{
                    //         res.status(200).json({ status: 200, message: "sukses" });
                    //     }
                    // });
                    absensiKaryawan.destroy({ where: { tglAbsenKaryawan: tglB } }).then((data2) => {
                        absensiKaryawan.bulkCreate(bulk).then((data3) => {
                            fs.unlink(filePath, (err) => {
                                if (err) {
                                    res.json(err);
                                } else {
                                    res.status(200).json({ status: 200, message: "sukses" });
                                }
                            });
                        });
                    }).catch((err) => {
                        res.status(500).json({ status: 500, message: "gagal", data: err });
                    });
                }
            });
        } else {
            res.status(200).json({ status: 200, message: "file kosong" });
        }
    }

    static register(req, res) {
        let { dataKaryawanId, bulkAbsenKaryawan } = req.body;

        karyawan.findAll({ where: { id: dataKaryawanId } }).then(async (data) => {
            if (data.length == 0) {
                res.status(200).json({ status: 200, message: "dataKaryawanId tidak ada" });
            } else {
                let idAbsen = [];
                let data2 =  await sq.query(`select * from "absensiKaryawan" ak where ak."deletedAt" isnull and ak."dataKaryawanId" = '${dataKaryawanId}' and date(ak."tglAbsenKaryawan") = '${moment(bulkAbsenKaryawan[0].tglAbsenKaryawan,"YYYY/MM/DD hh:mm:ss").format('YYYY-MM-DD')}'`);
                let data3 = await sq.query(`select * from "masterShift" ms where ms."deletedAt" isnull and ms.id = '${data[0].masterShiftId}'`);
                if(data2[0].length>0){
                    for (let i = 0; i < data2[0].length; i++) {
                        idAbsen.push(data2[0][i].id);
                    }
                }
                absensiKaryawan.destroy({where:{id:idAbsen}}).then((data4)=>{
                    for (let i = 0; i < bulkAbsenKaryawan.length; i++) {
                        bulkAbsenKaryawan[i].id = uuid_v4();
                        bulkAbsenKaryawan[i].dataKaryawanId = dataKaryawanId;
                        bulkAbsenKaryawan[i].ShiftKaryawan = data3[0][0].namaShift;
                    }
                    absensiKaryawan.bulkCreate(bulkAbsenKaryawan).then((data5) => {
                        res.status(200).json({ status: 200, message: "sukses" });
                    });
                });
            }
        }).catch((err) => {
            res.status(500).json({ status: 500, message: "gagal", data: err });
        });
    }

    static update(req, res) {
        const { absensiKaryawanId, tglAbsenKaryawan, dataKaryawanId } = req.body;
        tglAbsenKaryawan = moment(tglAbsenKaryawan, "YYYY/MM/DD hh:mm:ss").format();
        absensiKaryawan.findAll({ where: { id: absensiKaryawanId } }).then(async (data) => {
            if (data.length == 0) {
                res.status(200).json({ status: 200, message: "absensiKaryawanId tidak ada" });
            } else {
                let data2 = await sq.query(`select dk.*,ms."namaShift" from "dataKaryawan" dk join "masterShift" ms on ms.id = dk."masterShiftId" where dk."deletedAt" isnull and ms."deletedAt" isnull and dk.id = '${dataKaryawanId}'`);
                if (data2[0].length == 0) {
                    res.status(200).json({ status: 200, message: "dataKaryawanId tidak ada" });
                } else {
                    absensiKaryawan.update({ tglAbsenKaryawan, dataKaryawanId, ShiftKaryawan: data2[0][0].namaShift }, { where: { id: absensiKaryawanId } }).then((data3) => {
                        res.status(200).json({ status: 200, message: "sukses" });
                    });
                }
            }
        }).catch((err) => {
            res.status(500).json({ status: 500, message: "gagal", data: err });
        });
    }

    static async delete(req, res) {
        const { dataKaryawanId, bulkAbsenKaryawan } = req.body;
        let isi = "";
        for (let i = 1; i < bulkAbsenKaryawan.length; i++) {
            isi += `or ak."tglAbsenKaryawan" = '${bulkAbsenKaryawan[i].tglAbsenKaryawan}'`
        }
        let data = await sq.query(`select * from "absensiKaryawan" ak where ak."deletedAt" isnull and ak."dataKaryawanId" = '${dataKaryawanId}' and ak."tglAbsenKaryawan" = '${bulkAbsenKaryawan[0].tglAbsenKaryawan}'${isi}`);
        if (data[0].length == 0) {
            res.status(200).json({ status: 200, message: "data Tidak Ada" });
        } else {

            let tmp = [];
            for (let j = 0; j < data[0].length; j++) {
                tmp.push(data[0][j].id);
            }
            absensiKaryawan.destroy({ where: { id: tmp } }).then((data2) => {
                res.status(200).json({ status: 200, message: "sukses" });
            }).catch((err) => {
                res.status(500).json({ status: 500, message: "gagal", data: err });
            });
        }
    }

    static async list(req, res) {
        let data = await sq.query(`select ak.id as "absensiKaryawanId",ak.*,dk."namaKaryawan",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",ms."namaShift",ms."jamAwal",ms."jamAkhir" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" join "masterPosisi" mp on mp.id = dk."masterPosisiId" join "masterDivisi" md on md.id  = dk."masterDivisiId" where ak."deletedAt" isnull and dk."deletedAt" isnull group by  dk."namaKaryawan",date(ak."tglAbsenKaryawan"),ms."namaShift",ms."jamAwal",ms."jamAkhir", ak.id, dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi"`);
        res.status(200).json({ status: 200, message: "sukses", data: data[0] });
    }

    static async listAbsenByDivisi(req, res) {
        const { masterDivisiId } = req.params;
        let data = await sq.query(`select ak.id as "absensiKaryawanId",ak.*,dk."namaKaryawan",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",ms."namaShift",ms."jamAwal",ms."jamAkhir" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" join "masterPosisi" mp on mp.id = dk."masterPosisiId" join "masterDivisi" md on md.id  = dk."masterDivisiId" where ak."deletedAt" isnull and dk."deletedAt" isnull and md.id = '${masterDivisiId}' group by  dk."namaKaryawan",date(ak."tglAbsenKaryawan"),ms."namaShift",ms."jamAwal",ms."jamAkhir", ak.id, dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi"`);
        res.status(200).json({ status: 200, message: "sukses", data: data[0] });
    }

    static async listAbsenByPosisi(req, res) {
        const { masterPosisiId } = req.params;
        let data = await sq.query(`select ak.id as "absensiKaryawanId",ak.*,dk."namaKaryawan",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",ms."namaShift",ms."jamAwal",ms."jamAkhir" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" join "masterPosisi" mp on mp.id = dk."masterPosisiId" join "masterDivisi" md on md.id  = dk."masterDivisiId" where ak."deletedAt" isnull and dk."deletedAt" isnull and  mp.id = '${masterPosisiId}' group by  dk."namaKaryawan",date(ak."tglAbsenKaryawan"),ms."namaShift",ms."jamAwal",ms."jamAkhir", ak.id, dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi"`);
        res.status(200).json({ status: 200, message: "sukses", data: data[0] });
    }

    static async listAbsenByKaryawanId(req, res) {
        const { datakaryawanId } = req.params;
        let data = await sq.query(`select ak.id as "absensiKaryawanId",ak.*,dk."namaKaryawan",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",ms."namaShift",ms."jamAwal",ms."jamAkhir" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" join "masterPosisi" mp on mp.id = dk."masterPosisiId" join "masterDivisi" md on md.id  = dk."masterDivisiId" where ak."deletedAt" isnull and dk."deletedAt" isnull and  dk.id = '${datakaryawanId}' group by  dk."namaKaryawan",date(ak."tglAbsenKaryawan"),ms."namaShift",ms."jamAwal",ms."jamAkhir", ak.id, dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi"`);
        res.status(200).json({ status: 200, message: "sukses", data: data[0] });
    }

    static async listAbsenByBulan(req,res){
        let {bulan}= req.body;
        if(bulan){
            bulan = moment(bulan,"MM").format("MM");
        }else{
            bulan = moment().format('MM');
        }

        // let data =  await sq.query(`select ak.id as "absensiKaryawanId",date(ak."tglAbsenKaryawan")as "tglAbsen",to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS')as"jamAbsen",ak."tglAbsenKaryawan" ,ak."ShiftKaryawan",ak."createdAt",ak."updatedAt",ak."deletedAt",ak."dataKaryawanId",dk."namaKaryawan",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",dk."masterShiftId",ms."namaShift",ms."jamAwal",ms."jamAkhir", ak."masterIjinId", mi."namaIjin",ak."statusAbsenKaryawan" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" join "masterPosisi" mp on mp.id = dk."masterPosisiId" join "masterDivisi" md on md.id  = dk."masterDivisiId" left join "masterIjin" mi on mi.id = ak."masterIjinId" where ak."deletedAt" isnull and dk."deletedAt" isnull and EXTRACT(MONTH FROM ak."tglAbsenKaryawan") = '${bulan}' group by  dk."namaKaryawan",date(ak."tglAbsenKaryawan"),"tglAbsen","jamAbsen",ms."namaShift",ms."jamAwal",ms."jamAkhir", ak.id,dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",dk."masterShiftId", ak."masterIjinId", mi."namaIjin"`);
        let data =  await sq.query(`select ak."dataKaryawanId",dk."namaKaryawan",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",dk."masterShiftId",ms."namaShift", ak."ShiftKaryawan",date(ak."tglAbsenKaryawan") as "tglAbsen",count(date(ak."tglAbsenKaryawan")) as "totalMasuk",ak."statusAbsenKaryawan",ak."masterIjinId",mi."namaIjin" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterPosisi" mp on mp.id = dk."masterPosisiId" join "masterDivisi" md on md.id = dk."masterDivisiId" join "masterShift" ms on ms.id = dk."masterShiftId" left join "masterIjin" mi on mi.id = ak."masterIjinId" where ak."deletedAt" isnull and dk."deletedAt" isnull and EXTRACT(MONTH FROM ak."tglAbsenKaryawan") = '${bulan}' group by ak."dataKaryawanId",date(ak."tglAbsenKaryawan"), dk."namaKaryawan",ak."ShiftKaryawan",ak."statusAbsenKaryawan",ak."masterIjinId",mi."namaIjin",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",dk."masterShiftId",ms."namaShift"`);
        
        if(data[0].length==0){
            res.status(200).json({status:200,message:"data tidak ada"});
        }else{
            let tmp = [...new Map(JSON.parse(JSON.stringify(data[0])).map(item => [item['dataKaryawanId'], item])).values()];
            let hasil = [];
        
            for (let i = 0; i < tmp.length; i++) {
                let m=0; // berangkat
                let a=0; //alfa
                let c=0; // cuti/ijin
                let s=0;  // sakit
                
                for (let j = 0; j < data[0].length; j++) {
                    if(tmp[i].dataKaryawanId == data[0][j].dataKaryawanId){
                        if(data[0][j].totalMasuk < 2){
                            a+=1;
                        }
                        if(data[0][j].totalMasuk > 1){
                            
                            if(data[0][j].statusAbsenKaryawan == 0 ){
                                m+=1;
                            }
                            if(data[0][j].statusAbsenKaryawan == 1 ){
                                c+=1;
                            }
                            if(data[0][j].statusAbsenKaryawan == 2 ){
                                s+=1;
                            }
                            if(data[0][j].statusAbsenKaryawan == 3 ){
                                a+=1;
                            }
                        }
                    }    
                }
                hasil.push({dataKaryawanId:tmp[i].dataKaryawanId,namaKaryawan: tmp[i].namaKaryawan,masterPosisiId:tmp[i].masterPosisiId,namaPosisi:tmp[i].namaPosisi,masterDivisiId:tmp[i].masterDivisiId,namaDivisi:tmp[i].namaDivisi,masterShiftId:tmp[i].masterShiftId,namaShift:tmp[i].namaShift,totalberangkat:m,totalAbsen:a,"totalCuti/ijin":c,totalSakit:s});
            }
            
            // console.log(hasil);
            res.status(200).json({status:200,message:"sukses",data:hasil});
        }
    }

    static async detailAbsenKaryawanByBulan(req,res){
        let {bulan,dataKaryawanId} = req.body;
        if(bulan){
            bulan = moment(bulan,"MM").format("MM");
        }else{
            bulan = moment().format('MM');
        }

        let tgl = moment(bulan,"MM").format("YYYY-MM");
        // let data = await sq.query(`select ak.id as "absenKaryawanId",ak."tglAbsenKaryawan",ak."ShiftKaryawan",date(ak."tglAbsenKaryawan") as "tglAbsen", to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS')as"jamAbsen", ak."statusAbsenKaryawan",ak."dataKaryawanId", dk."namaKaryawan",dk."masterShiftId",ms."namaShift",ms."jamAwal",ms."jamAkhir",ak."masterIjinId",mi."namaIjin" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" left join "masterIjin" mi on ms.id = ak."masterIjinId" where ak."deletedAt" isnull and dk."deletedAt" isnull and ak."dataKaryawanId" = '${dataKaryawanId}' and EXTRACT(MONTH FROM ak."tglAbsenKaryawan") = '${bulan}' order by date(ak."tglAbsenKaryawan"),to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS') `);
        let data =  await sq.query(`select ak.id as "absenKaryawanId",ak."tglAbsenKaryawan",ak."ShiftKaryawan",date(ak."tglAbsenKaryawan") as "tglAbsen", to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS') as"jamAbsen", ak."statusAbsenKaryawan",ak."dataKaryawanId",dk."namaKaryawan",dk."masterShiftId",ms."namaShift",ms."jamAwal",ms."jamAkhir",ak."masterIjinId",mi."namaIjin" from "absensiKaryawan" ak left join "masterIjin" mi on mi.id = ak."masterIjinId" join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" where ak."deletedAt" isnull and dk."deletedAt" isnull and ak."dataKaryawanId" = '${dataKaryawanId}' and EXTRACT(MONTH FROM ak."tglAbsenKaryawan") = '${bulan}' order by date(ak."tglAbsenKaryawan"),to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS')`)
        // console.log(data[0]);
        if(data[0].length==0){
            res.status(200).json({status:200,message:"data tidak ada"});
        }else{
            
            let tmp = [];
            for (let i = 0; i < data[0].length; i++) {
                let cek = true;
                if(tmp.length>0){
                  for (let j = 0; j < tmp.length; j++) {
                     if(data[0][i].tglAbsen == tmp[j].tglAbsen){
                         cek = false;
                     }
                  }
                }
                if(cek){
                     tmp.push(data[0][i]);
                }
              }

            //   console.log(tmp);
            let data2 = {
                dataKaryawanId: data[0][0].dataKaryawanId,
                namaKaryawan: data[0][0].namaKaryawan,
                masterShiftId: data[0][0].masterShiftId,
                namaShift: data[0][0].namaShift,
                jamAwal: data[0][0].jamAwal,
                jamAkhir: data[0][0].jamAkhir,
                absen: []
            }

            // console.log(moment(`${tgl}-02`).format('dddd')=='Sunday');

            for (let k = 0; k < 31; k++) {
                let x = {
                    tgl : `${tgl}-0${k+1}`,
                    absenKaryawanIdMasuk : "",
                    ShiftKaryawan : "",
                    statusAbsenKaryawan :4,
                    jamMasuk : 0,
                    jamPulang : 0,
                    keterlambatan : 0,
                    absenKaryawanIdPulang : "",
                    namaIjin : ""
                }
                if(k>8){
                    x.tgl = `${tgl}-${k+1}`;
                }
                for (let l = 0; l < tmp.length; l++) {
                    if(tmp[l].tglAbsen == x.tgl){
                        let jamAwal = moment(`${tmp[l].jamAwal}`,"hh:mm:ss a");
                        let jamMasuk = moment(`${tmp[l].jamAbsen}`,"hh:mm:ss a");
                        x.absenKaryawanIdMasuk = tmp[l].absenKaryawanId;
                        x.ShiftKaryawan = tmp[l].ShiftKaryawan;
                        x.statusAbsenKaryawan = tmp[l].statusAbsenKaryawan;
                        x.jamMasuk = tmp[l].jamAbsen;
                        x.namaIjin = tmp[l].namaIjin
                        for (let m = 0; m < data[0].length; m++) {
                            if(tmp[l].tglAbsen == data[0][m].tglAbsen){
                                x.jamPulang = data[0][m].jamAbsen;
                                x.absenKaryawanIdPulang = data[0][m].absenKaryawanId;
                                if(tmp[l].jamAbsen == data[0][m].jamAbsen && tmp[l].jamAbsen == 0 ){
                                    x.jamPulang = 0;
                                }
                            }
                            
                        }
                        if(jamMasuk>jamAwal){
                            x.keterlambatan = jamMasuk.diff(jamAwal,"minutes");
                        }
                    }
                }
                data2.absen.push(x);
            }
            res.status(200).json({status:200,message:"sukses",data:[data2]});
        }
    }
}

module.exports = Controller

// static insert(req,res){

    //     if(req.files){
    //         let file1 = req.files.file1;
    //         let filePath = "./asset/file/"+file1.name;

    //         file1.mv(filePath,async (err)=>{
    //             if(err){
    //                 res.json(err);
    //             }else{
    //                 let data = parser.parseXls2Json(filePath); 
    //                 let tmp = [...new Map(data[0].map(item => [item['dataKaryawanId'], item])).values()];
    //                 let  bulk = [];
    //                 let isi = "";

    //                 for (let i = 0; i < tmp.length; i++) {
    //                     let min = JSON.parse(JSON.stringify(tmp[i]));
    //                     let max = JSON.parse(JSON.stringify(tmp[i]));
    //                     for (let j = 0; j < data[0].length; j++) {
    //                         if(tmp[i].dataKaryawanId==data[0][j].dataKaryawanId){
    //                             if(moment(data[0][j].tglAbsenKaryawan).format('HH:mm:ss') >= moment(max.tglAbsenKaryawan).format('HH:mm:ss')){
    //                                 max["dataKaryawanId"] = data[0][j].dataKaryawanId;
    //                                 max["tglAbsenKaryawan"] = data[0][j].tglAbsenKaryawan;
    //                             }
    //                             if(moment(data[0][j].tglAbsenKaryawan).format('HH:mm:ss') < moment(min.tglAbsenKaryawan).format('HH:mm:ss')){
    //                                 min["dataKaryawanId"] = data[0][j].dataKaryawanId;
    //                                 min["tglAbsenKaryawan"] = data[0][j].tglAbsenKaryawan;
    //                             }
    //                         }
    //                     }
    //                     bulk.push(min);
    //                     bulk.push(max);
    //                     if(i>0){
    //                         isi+=` or dk.id = '${tmp[i].dataKaryawanId}'`;
    //                     }
    //                 }
    //                 let ms =  await sq.query(`select dk.id as "dataKaryawanId",dk."namaKaryawan",dk."masterShiftId",ms."namaShift" from "dataKaryawan" dk join "masterShift" ms on ms.id = dk."masterShiftId" where dk."deletedAt" isnull  and dk.id = '${tmp[0].dataKaryawanId}'${isi}`);
    //                 // console.log("==============================");
    //                 // console.log(bulk);
    //                 // console.log("==============================");
    //                 // console.log(ms[0]);
    //                 // console.log("==============================");
    //                 let tgl = []
    //                 for (let k = 0; k < bulk.length; k++) {
    //                     bulk[k].id = uuid_v4();
    //                     tgl.push(bulk[k].tglAbsenKaryawan)
    //                     for (let l = 0; l < ms[0].length; l++) {
    //                         if(bulk[k].dataKaryawanId == ms[0][l].dataKaryawanId){
    //                             bulk[k].ShiftKaryawan = ms[0][l].namaShift;
    //                         }
    //                     }
    //                 }
    //                 absensiKaryawan.destroy({where:{tglAbsenKaryawan:tgl}}).then((data2)=>{
    //                     absensiKaryawan.bulkCreate(bulk).then((data3)=>{
    //                         fs.unlink(filePath,(err)=>{
    //                             if(err){
    //                                 res.json(err);
    //                             }else{
    //                                 res.status(200).json({ status: 200, message: "sukses" });
    //                             }
    //                         });
    //                     })
    //                 }).catch((err)=>{
    //                     res.status(500).json({ status: 500, message: "gagal", data: err });
    //                 });
    //             }
    //         });
    //     }else{
    //         res.status(200).json({ status: 200, message: "file kosong" });
    //     }
    // }

    // static register (req,res){
    //     let {dataKaryawanId,bulkAbsenKaryawan}= req.body;

    //     tglAbsenKaryawan = moment(tglAbsenKaryawan,"YYYY/MM/DD hh:mm:ss").format();
    //     karyawan.findAll({where:{id:dataKaryawanId}}).then(async(data)=>{
    //         if(data.length==0){
    //             res.status(200).json({status:200,message:"dataKaryawanId tidak ada"});
    //         }else{
    //             let data2 = await sq.query(`select * from "masterShift" ms where ms."deletedAt" isnull and ms.id = '${data[0]. masterShiftId}'`);
    //             absensiKaryawan.create({id:uuid_v4(),tglAbsenKaryawan,dataKaryawanId,ShiftKaryawan:data2[0][0].namaShift}).then((data3)=>{
    //                 res.status(200).json({ status: 200, message: "sukses" });
    //             });
    //         }
    //     }).catch((err)=>{
    //         res.status(500).json({ status: 500, message: "gagal", data: err });
    //     });
    // }

    // static delete(req,res){
    //     const {absensiKaryawanId} = req.body;

    //     absensiKaryawan.findAll({where:{id:absensiKaryawanId}}).then((data)=>{
    //         if(data.length==0){
    //             res.status(200).json({status:200,message:"data sudah terhapus"});
    //         }else{
    //             absensiKaryawan.destroy({where:{id:absensiKaryawanId}}).then((data2)=>{
    //                 res.status(200).json({status:200,message:"sukses"});
    //             });
    //         }
    //     }).catch((err)=>{
    //         res.status(500).json({ status: 500, message: "gagal", data: err });
    //     });
    // }

    // static async listAbsenByBulan(req,res){

    //     let data = await sq.query(`select ak.id as "absensiKaryawanId",date(ak."tglAbsenKaryawan")as "tglAbsen",to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS')as"jamAbsen",ak."tglAbsenKaryawan" ,ak."ShiftKaryawan",ak."createdAt",ak."updatedAt",ak."deletedAt",ak."dataKaryawanId",dk."namaKaryawan",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",dk."masterShiftId",ms."namaShift",ms."jamAwal",ms."jamAkhir" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" join "masterPosisi" mp on mp.id = dk."masterPosisiId" join "masterDivisi" md on md.id  = dk."masterDivisiId" where ak."deletedAt" isnull and dk."deletedAt" isnull and date(ak."tglAbsenKaryawan") between '${new moment().startOf('month').format("YYYY-MM-DD")}' and '${new moment().endOf("month").format("YYYY-MM-DD")}' group by  dk."namaKaryawan",date(ak."tglAbsenKaryawan"),"tglAbsen","jamAbsen",ms."namaShift",ms."jamAwal",ms."jamAkhir", ak.id, dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",dk."masterShiftId"`);
    //     let tmp = [...new Map(JSON.parse(JSON.stringify(data[0])).map(item => [item['dataKaryawanId'], item])).values()];
    //     let jadwal = [...new Map(data[0].map(v => [JSON.stringify([v.dataKaryawanId,v.tglAbsen]), v])).values()];
    //     let data2 = [];
    //     let hasil = [];

    //     for (let i = 0; i < data[0].length; i++) {
    //         let isi = true;
    //         for (let j = 0; j < jadwal.length; j++) {
    //             if(data[0][i].dataKaryawanId == jadwal[j].dataKaryawanId && data[0][i].tglAbsen == jadwal[j].tglAbsen){
    //                 if(data[0][i].jamAbsen == jadwal[j].jamAbsen){
    //                     data[0][i].jamAbsen2 = 0;
    //                     break;
    //                 }
    //                 data[0][i].jamAbsen2 = jadwal[j].jamAbsen
    //             }
    //         }
    //         if(data2.length){
    //             for (let k = 0; k < data2.length; k++) {
    //                 if(data[0][i].dataKaryawanId == data2[k].dataKaryawanId && data[0][i].tglAbsen == data2[k].tglAbsen){
    //                     isi = false;
    //                 }
    //             }   
    //         }
    //         if(isi){
    //         data2.push(data[0][i]);
    //         }
    //     }

    //     for (let l = 0; l < tmp.length; l++) {
    //         let x = {
    //                 dataKaryawanId :tmp[l].dataKaryawanId,
    //                 namaKaryawan :tmp[l].namaKaryawan,
    //                 masterPosisiId :tmp[l].masterPosisiId,
    //                 namaPosisi :tmp[l].namaPosisi,
    //                 masterDivisiId :tmp[l].masterDivisiId,
    //                 namaDivisi :tmp[l].namaDivisi,
    //                 masterShiftId :tmp[l].masterShiftId,
    //                 namaShift :tmp[l].namaShift,
    //                 jamAwal :tmp[l].jamAwal,
    //                 jamAkhir :tmp[l].jamAkhir,
    //                 absen:[]
    //                 };
    //         for (let m = 0; m < 31; m++) {
    //             let y ={
    //                     tgl : `${moment().format("YYYY-MM")}-0${m+1}`,
    //                     jamMasuk : 0,
    //                     jamPulang : 0,
    //                     tglAbsenKaryawan : 0,
    //                     ShiftKaryawan : "",
    //                     }
    //             if(m>8){
    //                 y.tgl = `${moment().format("YYYY-MM")}-${m+1}`;
    //             }
    //             for (let n = 0; n < data2.length; n++) {
    //                 if(x.dataKaryawanId == data2[n].dataKaryawanId && y.tgl == data2[n].tglAbsen){
    //                     y.jamMasuk = data2[n].jamAbsen;
    //                     y.jamPulang = data2[n].jamAbsen2;
    //                     y.tglAbsenKaryawan = data2[n].tglAbsenKaryawan;
    //                     y.ShiftKaryawan = data2[n].ShiftKaryawan;
    //                 }
    //             }
    //             x.absen.push(y);
    //         }
    //         hasil.push(x);
    //     }

    // static insert(req,res){

    //     if(req.files){
    //         let file1 = req.files.file1;
    //         let filePath = "./asset/file/"+file1.name;

    //         file1.mv(filePath,async (err)=>{
    //             if(err){
    //                 res.json(err);
    //             }else{
    //                 // let data = parser.parseXls2Json(filePath);
    //                 let data = await csv().fromFile(filePath); 

    //                 for (let i = 0; i < data[0].length; i++) {
    //                     data[0][i].tglAbsenKaryawan = moment(data[0][i].tglAbsenKaryawan,"YYYY/MM/DD hh:mm:ss").format();
    //                     data[0][i].tgl = moment(data[0][i].tglAbsenKaryawan).format("YYYY-MM-DD");
    //                     data[0][i].jam = moment(data[0][i].tglAbsenKaryawan).format('HH:mm:ss');
    //                 }

    //                 const tmp = [...new Map(data[0].map(v => [JSON.stringify([v.dataKaryawanId,v.tgl]), v])).values()]
    //                 let  bulk = [];
    //                 let isi = "";

    //                 for (let j = 0; j < tmp.length; j++) {
    //                     let min = JSON.parse(JSON.stringify(tmp[j]));
    //                     let max = JSON.parse(JSON.stringify(tmp[j]));
    //                    for (let k = 0; k < data[0].length; k++) {
    //                        if(tmp[j].dataKaryawanId == data[0][k].dataKaryawanId){
    //                            if(tmp[j].tgl == data[0][k].tgl){
    //                                if(data[0][k].jam >= max.jam){
    //                                 max["dataKaryawanId"] = data[0][k].dataKaryawanId;
    //                                 max["tglAbsenKaryawan"] = data[0][k].tglAbsenKaryawan;
    //                                 max["tgl"] = data[0][k].tgl;
    //                                 max["jam"] = data[0][k].jam;
    //                                }
    //                                if(data[0][k].jam < min.jam){
    //                                 min["dataKaryawanId"] = data[0][k].dataKaryawanId;
    //                                 min["tglAbsenKaryawan"] = data[0][k].tglAbsenKaryawan;
    //                                 min["tgl"] = data[0][k].tgl;
    //                                 min["jam"] = data[0][k].jam;
    //                                }
    //                            }
    //                        }
    //                    }
    //                    bulk.push(min);
    //                    bulk.push(max);
    //                    if(j>0){
    //                     isi+=` or dk.id = '${tmp[j].dataKaryawanId}'`;
    //                     }
    //                 }

    //                 let ms =  await sq.query(`select dk.id as "dataKaryawanId",dk."namaKaryawan",dk."masterShiftId",ms."namaShift" from "dataKaryawan" dk join "masterShift" ms on ms.id = dk."masterShiftId" where dk."deletedAt" isnull  and dk.id = '${tmp[0].dataKaryawanId}'${isi}`);
    //                 let tglB = [];
    //                 for (let l = 0; l < bulk.length; l++) {
    //                     bulk[l].id = uuid_v4();
    //                     tglB.push(bulk[l].tglAbsenKaryawan)
    //                     for (let m = 0; m < ms[0].length; m++) {
    //                         if(bulk[l].dataKaryawanId == ms[0][m].dataKaryawanId){
    //                             bulk[l].ShiftKaryawan = ms[0][m].namaShift;
    //                         }
    //                     }
    //                 }
    //                 // console.log(bulk);
    //                 // console.log(tglB);
    //                 // console.log(isi);
    //                 // console.log(ms[0]);
    //                 fs.unlink(filePath,(err)=>{
    //                     if(err){
    //                         res.json(err);
    //                     }else{
    //                         res.status(200).json({ status: 200, message: "sukses" });
    //                     }
    //                 });
    //                 absensiKaryawan.destroy({where:{tglAbsenKaryawan:tglB}}).then((data2)=>{
    //                     absensiKaryawan.bulkCreate(bulk).then((data3)=>{
    //                         fs.unlink(filePath,(err)=>{
    //                             if(err){
    //                                 res.json(err);
    //                             }else{
    //                                 res.status(200).json({ status: 200, message: "sukses" });
    //                             }
    //                         });
    //                     });
    //                 }).catch((err)=>{
    //                     res.status(500).json({ status: 500, message: "gagal", data: err });
    //                 });
    //             }
    //         });
    //     }else{
    //         res.status(200).json({ status: 200, message: "file kosong" });
    //     }
    // }

    // static async listAbsenByBulan(req,res){

    //     let data = await sq.query(`select ak.id as "absensiKaryawanId",date(ak."tglAbsenKaryawan")as "tglAbsen",to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS')as"jamAbsen",ak."tglAbsenKaryawan" ,ak."ShiftKaryawan",ak."createdAt",ak."updatedAt",ak."deletedAt",ak."dataKaryawanId",dk."namaKaryawan",dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",dk."masterShiftId",ms."namaShift",ms."jamAwal",ms."jamAkhir" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" join "masterPosisi" mp on mp.id = dk."masterPosisiId" join "masterDivisi" md on md.id  = dk."masterDivisiId" where ak."deletedAt" isnull and dk."deletedAt" isnull and date(ak."tglAbsenKaryawan") between '${new moment().startOf('month').format("YYYY-MM-DD")}' and '${new moment().endOf("month").format("YYYY-MM-DD")}' group by  dk."namaKaryawan",date(ak."tglAbsenKaryawan"),"tglAbsen","jamAbsen",ms."namaShift",ms."jamAwal",ms."jamAkhir", ak.id, dk."masterPosisiId",mp."namaPosisi",dk."masterDivisiId",md."namaDivisi",dk."masterShiftId"`);
    //     let tmp = [...new Map(JSON.parse(JSON.stringify(data[0])).map(item => [item['dataKaryawanId'], item])).values()];
    //     let data2 = [];
    //     let hasil = [];

    //     for (let i = 0; i < tmp.length; i++) {
    //         let x = {
    //             dataKaryawanId :tmp[i].dataKaryawanId,
    //             namaKaryawan :tmp[i].namaKaryawan,
    //             masterPosisiId :tmp[i].masterPosisiId,
    //             namaPosisi :tmp[i].namaPosisi,
    //             masterDivisiId :tmp[i].masterDivisiId,
    //             namaDivisi :tmp[i].namaDivisi,
    //             masterShiftId :tmp[i].masterShiftId,
    //             namaShift :tmp[i].namaShift,
    //             jamAwal :tmp[i].jamAwal,
    //             jamAkhir :tmp[i].jamAkhir,
    //             absen:[]
    //         };
    //         for (let j = 0; j < 31; j++) {
    //             let y ={
    //                 tgl : `${moment().format("YYYY-MM")}-0${j+1}`,
    //                 jam : []
    //             }
    //             if(j>8){
    //                 y.tgl = `${moment().format("YYYY-MM")}-${j+1}`
    //             }
    //             for (let k = 0; k < data[0].length; k++) {
    //                 let z={};
    //                if(x.dataKaryawanId == data[0][k].dataKaryawanId && y.tgl == data[0][k].tglAbsen){
    //                 z.absensiKaryawanId = data[0][k].absensiKaryawanId;
    //                 z.jamAbsen = data[0][k].jamAbsen;
    //                 z.tglAbsen = data[0][k].tglAbsen;
    //                 z.tglAbsenKaryawan = data[0][k].tglAbsenKaryawan;
    //                 z.ShiftKaryawan = data[0][k].ShiftKaryawan;
    //                 y.jam.push(z)
    //                }
    //             }
    //             x.absen.push(y)
    //         }
    //         hasil.push(x)
    //     }

    //     res.status(200).json({status:200,message:"sukses",data:hasil});
    // }

    // static async detailAbsenKaryawanByBulan(req,res){
    //     let {bulan,dataKaryawanId} = req.body;
    //     if(bulan){
    //         bulan = moment(bulan,"MM").format("MM");
    //     }else{
    //         bulan = moment().format('MM');
    //     }

    //     let tgl = moment(bulan,"MM").format("YYYY-MM");
    //     // let data = await sq.query(`select ak.id as "absenKaryawanId",ak."tglAbsenKaryawan",ak."ShiftKaryawan",date(ak."tglAbsenKaryawan") as "tglAbsen", to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS')as"jamAbsen", ak."statusAbsenKaryawan",ak."dataKaryawanId", dk."namaKaryawan",dk."masterShiftId",ms."namaShift",ms."jamAwal",ms."jamAkhir",ak."masterIjinId",mi."namaIjin" from "absensiKaryawan" ak join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" left join "masterIjin" mi on ms.id = ak."masterIjinId" where ak."deletedAt" isnull and dk."deletedAt" isnull and ak."dataKaryawanId" = '${dataKaryawanId}' and EXTRACT(MONTH FROM ak."tglAbsenKaryawan") = '${bulan}' order by date(ak."tglAbsenKaryawan"),to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS') `);
    //     let data =  await sq.query(`select ak.id as "absenKaryawanId",ak."tglAbsenKaryawan",ak."ShiftKaryawan",date(ak."tglAbsenKaryawan") as "tglAbsen", to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS') as"jamAbsen", ak."statusAbsenKaryawan",ak."dataKaryawanId",dk."namaKaryawan",dk."masterShiftId",ms."namaShift",ms."jamAwal",ms."jamAkhir",ak."masterIjinId",mi."namaIjin" from "absensiKaryawan" ak left join "masterIjin" mi on mi.id = ak."masterIjinId" join "dataKaryawan" dk on dk.id = ak."dataKaryawanId" join "masterShift" ms on ms.id = dk."masterShiftId" where ak."deletedAt" isnull and dk."deletedAt" isnull and ak."dataKaryawanId" = '${dataKaryawanId}' and EXTRACT(MONTH FROM ak."tglAbsenKaryawan") = '${bulan}' order by date(ak."tglAbsenKaryawan"),to_char(ak."tglAbsenKaryawan" , 'HH24:MI:SS')`)
    //     console.log(data);
    //     if(data[0].length==0){
    //         res.status(200).json({status:200,message:"data tidak ada"});
    //     }else{
            
    //         let tmp = [];
    //         for (let i = 0; i < data[0].length; i++) {
    //             let cek = true;
    //             if(tmp.length>0){
    //               for (let j = 0; j < tmp.length; j++) {
    //                  if(data[0][i].tglAbsen == tmp[j].tglAbsen){
    //                      cek = false;
    //                  }
    //               }
    //             }
    //             if(cek){
    //                  tmp.push(data[0][i]);
    //             }
    //           }

    //         let data2 = {
    //             dataKaryawanId: data[0][0].dataKaryawanId,
    //             namaKaryawan: data[0][0].namaKaryawan,
    //             masterShiftId: data[0][0].masterShiftId,
    //             namaShift: data[0][0].namaShift,
    //             jamAwal: data[0][0].jamAwal,
    //             jamAkhir: data[0][0].jamAkhir,
    //             absen: []
    //         }

    //         for (let k = 0; k < 31; k++) {
    //             let x = {
    //                 tgl : `${tgl}-0${k+1}`,
    //                 absenKaryawanIdMasuk : "",
    //                 ShiftKaryawan : "",
    //                 statusAbsenKaryawan :"",
    //                 jamMasuk : 0,
    //                 jamPulang : 0,
    //                 keterlambatan : 0,
    //                 absenKaryawanIdPulang : ""
    //             }
    //             if(k>8){
    //                 x.tgl = `${tgl}-${k+1}`;
    //             }
    //             for (let l = 0; l < tmp.length; l++) {
    //                 if(tmp[l].tglAbsen == x.tgl){
    //                     let jamAwal = moment(`${tmp[l].jamAwal}`,"hh:mm:ss a");
    //                     let jamMasuk = moment(`${tmp[l].jamAbsen}`,"hh:mm:ss a");
    //                     x.absenKaryawanIdMasuk = tmp[l].absenKaryawanId;
    //                     x.ShiftKaryawan = tmp[l].ShiftKaryawan;
    //                     x.statusAbsenKaryawan = tmp[l].statusAbsenKaryawan;
    //                     x.jamMasuk = tmp[l].jamAbsen;
    //                     for (let m = 0; m < data[0].length; m++) {
    //                         if(tmp[l].tglAbsen == data[0][m].tglAbsen){
    //                             x.jamPulang = data[0][m].jamAbsen;
    //                             x.absenKaryawanIdPulang = data[0][m].absenKaryawanId;
    //                             if(tmp[l].jamAbsen == data[0][m].jamAbsen){
    //                                 x.jamPulang = 0;
    //                                 x.absenKaryawanIdPulang = ""
    //                             }
    //                         }
                            
    //                     }
    //                     if(jamMasuk>jamAwal){
    //                         x.keterlambatan = jamMasuk.diff(jamAwal,"minutes");
    //                     }
    //                 }
    //             }
    //             data2.absen.push(x);
    //         }
    //         res.status(200).json({status:200,message:"sukses",data:[data2]});
    //     }
    // }