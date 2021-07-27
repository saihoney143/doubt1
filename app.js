const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbpath = path.join(__dirname,"covid19India.db");

const app = express();
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db=await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Running server at 3000");
    });
  } catch (error) {
    console.log(`db error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const cnvrtstate = (a) => {
  return {
    stateId: a.state_id,
    stateName: a.state_name,
    population: a.population,
  };
};

const cnvrtdistrict = (a) => {
  return {
    districtId: a.district_id,
    districtName: a.district_name,
    stateId: a.state_id,
    cases: a.cases,
    cured: a.cured,
    active: a.active,
    deaths: a.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const StatesArray = await db.all(getStatesQuery);
  response.send(StatesArray.map((a) => cnvrtstate(a)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const States = await db.get(getStatesQuery);
  response.send(cnvrtstate(States));
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getStatesQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const DistrictArray = await db.get(getStatesQuery);
  response.send(cnvrtdistrict(DistrictArray));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    stateId,
    districtName,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDetails = `INSERT INTO district(state_id, district_name, cases, cured, active, deaths)
    values(${stateId},"${districtName}",${cases},${cured},${active},${deaths});`;
  await db.run(addDetails);
  response.send("District Successfully Added");
});



app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed"));
});

app.put("/districts/:districtId/", async (request, response) => {
  const{districtId}=request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths} = districtDetails;
  const updateDetails = `UPDATE district SET district_name="${districtName}",state_id=${stateId},cases=${cases},
  cured=${cured},active=${active},deaths=${deaths} WHERE
    district_id = ${districtId};`;
  await db.run(updateDetails);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const DistrictArray = await db.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports=app;