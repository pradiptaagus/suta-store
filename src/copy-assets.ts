import shell from "shelljs";
import path from "path";

shell.rm("-rf", path.join(__dirname, "../dist/public"));
shell.cp("-Rf", path.join(__dirname, "/public"), path.join(__dirname, "../dist/public"));

shell.rm("-rf", path.join(__dirname, "../dist/views"));
shell.cp("-Rf", path.join(__dirname, "/views"), path.join(__dirname, "../dist/views"));