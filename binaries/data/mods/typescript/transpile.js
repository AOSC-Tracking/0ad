class ZeroAdHost {
	createdFiles = {};
	
	writeFile(fileName, contents) {
		this.createdFiles[fileName] = contents;
	}
	getExecutingFilePath(...args) {
		return "__fake_exec.ts"
	}
	getCurrentDirectory(...args) {
		return ""
	}
	directoryExists(dir) {
		return Engine.FileExists(dir);
	}
	fileExists(file) {
		return Engine.FileExists(file);
	}
	readFile(file) {
		if (this.fileExists(file))
			return Engine.ReadFile(file);
		// Fake node resolution for the declaration files
		if (this.fileExists("node_modules/typescript/lib/" + file))
			return Engine.ReadFile("node_modules/typescript/lib/" + file);
		return undefined;
	}
};

function transpile(file)
{
	const options = {
		target: "es2020",
		noImplicitAny: false,
		allowJs: true,
		declaration: true,
	};

	const parsedOptions = ts.convertCompilerOptionsFromJson(
		options, "", "tsconfig.json"
	).options;

	const hostProxy = new ZeroAdHost();
	
	const host = ts.createCompilerHostWorker(options, undefined, hostProxy);

	// Prepare and emit the d.ts files
	const program = ts.createProgram(["simulation/Engine.d.ts", file], parsedOptions, host);
	const emitResult = program.emit();

	let allDiagnostics = ts
    	.getPreEmitDiagnostics(program)
    	.concat(emitResult.diagnostics);

	allDiagnostics.forEach(diagnostic => {
		if (diagnostic.file) {
			let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start/*!*/);
			let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
			warn(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
		} else {
			warn(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
		}
	});

	return hostProxy.createdFiles[file.replace(".ts", ".js")];
}

function transpileOnly(source) {
  	const { outputText } = ts.transpileModule(source,
	{
		compilerOptions:  {
			target: "ES6",
			noImplicitAny: true,
			strict: true,
		},
		reportDiagnostics: true,
		fileName: "file.ts",
		moduleName: "module",
	});
	return outputText;
}

//transpile("simulation/AutoBuildable.ts");
