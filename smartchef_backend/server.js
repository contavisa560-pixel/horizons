// server.js
require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const { readUsers, writeUsers } = require("./db");

// Rotas
const authRoutes = require("./auth");
const openaiChatRoute = require("./routes/openaiChat");

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// Sessões
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -------------------------------
// ROTAS PRINCIPAIS
// -------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/openai", openaiChatRoute);

// -------------------------------
// GOOGLE LOGIN
// -------------------------------
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const users = readUsers();
      let user = users.find((u) => u.email === profile.emails[0].value);

      if (!user) {
        user = {
          id: "google_" + profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          provider: "google",
          picture: profile.photos[0].value,
          passwordHash: null,
          level: 1,
          points: 0,
          favorites: [],
          isPremium: false,
        };

        users.push(user);
        writeUsers(users);
      }

      return done(null, user);
    }
  )
);

app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.CLIENT_URL,
    session: true,
  }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL + "/google-success");
  }
);

app.get("/api/auth/google/success", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "User not authenticated" });

  res.json({ user: req.user });
});

// -------------------------------
// UPLOAD DE AVATAR
// -------------------------------
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const fileName = `${req.params.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

app.post("/api/users/:id/avatar", upload.single("avatar"), (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.params.id);

  if (!user) return res.status(404).json({ error: "user_not_found" });

  user.picture = `${process.env.SERVER_URL}/uploads/${req.file.filename}`;
  writeUsers(users);

  res.json({ imageUrl: user.picture });
});

// -------------------------------
// PUT /api/users/:id  (FALTAVA!!!)
// -------------------------------
app.put("/api/users/:id", (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.params.id);

  if (!user) return res.status(404).json({ error: "user_not_found" });

  Object.assign(user, req.body);

  writeUsers(users);
  res.json({ success: true, user });
});

// -------------------------------
// START SERVER
// -------------------------------
app.listen(process.env.PORT, () => {
  console.log(`🔥 Backend a correr em http://localhost:${process.env.PORT}`);
  console.log("💡 GROQ API Key:", process.env.GROQ_API_KEY ? "OK ✔" : "❌ NÃO DEFINIDA");
});
