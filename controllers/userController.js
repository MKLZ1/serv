const User = require("../models/User");
const jwt = require("jsonwebtoken");

module.exports.signup = async (req, res, next) => {
  const userData = req.body;

  const userBD = await User.findOne({ username: userData.username });
  if (userBD != null) {
    res.status(400).json({ error: "El nombre de usuario ya existe" });
    return;
  }
  const newUser = new User(userData);
  await newUser.save();
  res.status(201).json({ message: "usuario creado correctamente" });

  console.log("Se registro el usuario : ", req.body);
};
module.exports.login = async (req, res, next) => {
  const userData = req.body;

  const userBD = await User.findOne({ username: userData.username });
//   console.log("intento de login ",userData,userBD);
//   console.log("condicion ", userBD.password , userData.password, userBD.password == userData.password);
  if (userBD != null && userBD.password == userData.password) {
    const token = crearToken(userData.username);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: tiempoMaximo * 1000,
      sameSite: "none",
      secure:"false"
    });
    res.status(201).json({ message: "usuario creado correctamente", token });
  } else {
    res
      .status(400)
      .json({
        error:
          "El nombre de usuario no esta registrado o la contraseña no coincide",
      });
    return;
  }

  console.log("Se logeo el usuario : ", req.body);
};
const tiempoMaximo = 30000; //segundos

const crearToken = (username) => {
  return jwt.sign({ username }, "efe", {
    expiresIn: tiempoMaximo,
  });
};
