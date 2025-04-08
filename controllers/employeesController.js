const data = {};

data.employees = require("../model/employees.json");

const getAllEmployees = (req, res) =>
    {
        res.json(data.employees);
    }

const getEmployee = (req, res) =>
{
    res.json({"id": req.params.id});
}
    
const createNewEmployee = (req, res) =>
    {
        res.json
        (
            {
                "firstname" : req.body.firstname,
                "lastname" : req.body.lastname
            }
        );
    }

const updateEmployee = (req, res) =>
    {
        res.json
        (
            {
                "firstname" : req.body.firstname,
                "lastname" : req.body.lastname
            }
        );
    }

// Changed to match the pattern of other functions using the JSON file
const deleteEmployee = (req, res) =>
    {
        res.json({"id": req.body.id});
    }

module.exports =
{
    getAllEmployees,
    getEmployee,
    createNewEmployee,
    updateEmployee,
    deleteEmployee
}