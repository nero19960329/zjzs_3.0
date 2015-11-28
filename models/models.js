var mongojs = require('mongojs');
var tickets = "ticket";
var activities = "activity";
var students = "student";
var admins = "manager";
var seats = "seat";
var requests = "request";

exports.tickets = tickets;
exports.activities = activities;
exports.students = students;
exports.admins = admins;
exports.seats = seats;
exports.requests = requests;

exports.db = mongojs('mongodb://localhost/ticket', [tickets, activities, students, admins, seats, requests]);

exports.getIDClass=function(idValue)
{
    idValue=""+idValue;
    return mongojs.ObjectId(idValue);
}

exports.authIP = "101.200.233.45";
exports.authPort = 9003;
exports.authPrefix = "/v1";
