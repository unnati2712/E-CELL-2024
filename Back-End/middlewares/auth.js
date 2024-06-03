import { getUser } from "../service/auth.js";
export async function restrictToLogInUserOnly(req, res, next) {
  // const session_id= req.cookies?.session_id;
  // console.log(req.cookies);
  // const session_id= req.headers["authorization"];
  // console.log(session_id);
  // if(!session_id){
  //     return res.redirect("/login");
  // };
  const token = req.cookies.token;
  // console.log(req.cookies.token);
  // const User= getUser(session_id);
  const User = getUser(token);
  if (!User) {
    return res.redirect("/login");
  }
  req.user = User;
  next();
}

export async function checkAuth(req, res, next) {
  // const session_id= req.cookies?.session_id;
  // const session_id= req.headers["authorization"];
  // const token= session_id.split("Bearer ")[1];
  //   const User= getUser(session_id);
  const token = req.cookies.token;
  const User = getUser(token);
  req.user = User;
  next();
}
