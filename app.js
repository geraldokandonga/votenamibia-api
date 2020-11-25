const path = require("path"),
  express = require("express"),
  morgan = require("morgan"),
  rateLimit = require("express-rate-limit"),
  helmet = require("helmet"),
  mongoSanitize = require("express-mongo-sanitize"),
  xss = require("xss-clean"),
  hpp = require("hpp"),
  bodyParser = require("body-parser"),
  cookieParser = require("cookie-parser"),
  compression = require("compression"),
  cors = require("cors");

// IMPORTS  ROUTES
const AppError = require("./Api/_utils/appError");
const globalErrorHandler = require("./Api/_helpers/errors");

const app = express();

app.enable("trust proxy");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// GLOBAL MIDDLEWARE

// Implement CORS
app.use(cors());
// ALLow-Control-Allow-Origin *
app.options("*", cors());

// GLOBAL VARIABLES

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// SECURE HTTP
app.use(helmet());

// Development logging
if (process.env.MODE_ENV === "development") {
  app.use(morgan("dev"));
}
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour"
});
app.use("/api", limiter);

// Body parser, reading data from the body into req.body
app.use(bodyParser.json({ limit: "10kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NO-SQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

app.use(compression());

// middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use("/api/v1/auth", require("./Api/auth/auth.routes"));
app.use("/api/v1/users", require("./Api/users/user.routes"));
app.use("/api/v1/regions", require("./Api/regions/region.routes"));
app.use(
  "/api/v1/constituencies",
  require("./Api/constituencies/constituency.routes")
);

app.use(
  "/api/v1/polling-stations",
  require("./Api/pollingstations/pollingstation.routes")
);

app.use(
  "/api/v1/announcements",
  require("./Api/announcements/announcement.routes")
);

app.use("/api/v1/news", require("./Api/news/news.routes"));

app.use("/api/v1/stats", require("./Api/stats/stats.routes"));

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// global error handler
app.use(globalErrorHandler);

module.exports = app;
