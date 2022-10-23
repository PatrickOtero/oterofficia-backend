"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const receiveEmail_1 = require("./controllers/receiveEmail");
const studyPostController_1 = require("./controllers/studyPostController");
const routes = (0, express_1.Router)();
exports.routes = routes;
routes.post("/studyPost", studyPostController_1.createStudyPost);
routes.post("/receiveEmail", receiveEmail_1.receiveEmail);
