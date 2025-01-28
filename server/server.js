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
const { analyzeData } = require("./data/aiIntegration");


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
app.use("/api/dashboard", dashboardRouter);


// Route to analyze data
app.post("/api/analyze", async (req, res) => {
    try {
      const inputData = req.body; // Input data from the client
      const analysisResult = await analyzeData(inputData); // Call Python API
      res.json(analysisResult); // Return analyzed data to the client
    } catch (error) {
      console.error("Error in analysis route:", error.message);
      res.status(500).json({ error: "Failed to analyze data" });
    }
  });
  
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
