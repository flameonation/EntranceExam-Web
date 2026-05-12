require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const questionRoutes = require("./routes/questionRoutes");
const resultRoutes = require("./routes/resultRoutes");
const settingsRouter = require("./routes/settings");
const notesRoutes = require('./routes/notesRoutes');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

app.use("/api/users", userRoutes);
app.use("/api", questionRoutes);
app.use("/api", resultRoutes);
app.use("/api/settings", settingsRouter);
app.use('/api/notes', notesRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server on ${PORT}`);
});