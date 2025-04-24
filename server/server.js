const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const port = process.env.PORT;

app.use(cookieParser(process.env.JWT_SECRET));
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());


// Connect to Mongoose DB
mongoose
    .connect(process.env.MONGO_DB_URI, {
        serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true,
        }
    })
    .then(() => {
        console.log("DB Connection ready");
    })
    .catch((err) => console.log(err));


// ROUTES
const authenticationRouter = require("./authetication/routes/authenticationRouter");
app.use("/api/auth", authenticationRouter);


const dashboardRouter = require("./dashboard/routes/dashboardRoutes");
app.use("/api/dash", dashboardRouter);


const profileRouter = require("./profile/routes/profileRoutes");
app.use("/api/profile", profileRouter);

const foodRouter = require("./food-diary/routes/foodRoutes");
app.use("/api/food", foodRouter);


const weightRouter = require("./weight/routes/weightRoutes");
app.use("/api/weight", weightRouter);

const exerciseRouter = require("./exercise/routes/exerciseRoutes");
app.use("/api/exercise", exerciseRouter);



// Serve UI
if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build/index.html"));

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname + "/../client/build/index.html"));
    });
}

// Start App
app.listen(port, () => {
    console.log(`Server started on Port - ${port}`);
});
