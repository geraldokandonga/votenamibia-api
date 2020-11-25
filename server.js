const mongoose = require("mongoose"),
  dotenv = require("dotenv");

process.on("uncaughtException", err => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({
  path: "./config.env"
});

const app = require("./app");

const DATABASE =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE
    : process.env.DATABASE_LOCAL;

const DB = DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

// DB CONNECTION
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
  })
  .then(() => console.log("DB connection successful!"));

const port = process.env.NODE_ENV === "production" ? process.env.PORT : 4000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", err => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("Process terminated!");
  });
});
