import rimraf from "rimraf";
import path from "path";

rimraf(path.join(__dirname, "../dist"), function() {
    "Build directory cleaned.";
});