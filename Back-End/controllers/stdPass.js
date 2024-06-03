import  StdPass from "../models/stdPass.js";

export async function  handleStudentPass(req, res){
    try {
      const stdPass = await StdPass.find();
      if (stdPass) {
        res.json(stdPass);
      } else {
        res.json("notExists");
      }
    } catch (error) {
      res.json("notExists");
    }
  };

