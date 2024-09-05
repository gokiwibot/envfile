"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = run;
const core = __importStar(require("@actions/core"));
const camel_case_1 = require("camel-case");
const constant_case_1 = require("constant-case");
const fs_1 = require("fs");
const pascal_case_1 = require("pascal-case");
const snake_case_1 = require("snake-case");
const convertTypes = {
    lower: s => s.toLowerCase(),
    upper: s => s.toUpperCase(),
    camel: camel_case_1.camelCase,
    constant: constant_case_1.constantCase,
    pascal: pascal_case_1.pascalCase,
    snake: snake_case_1.snakeCase
};
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let excludeList = [
            // this variable is already exported automatically
            'github_token'
        ];
        try {
            const secretsJson = core.getInput('secrets', { required: true });
            const file = core.getInput('file');
            const noEnvInput = core.getInput('no_env');
            const keyPrefix = core.getInput('prefix');
            const includeListStr = core.getInput('include');
            const excludeListStr = core.getInput('exclude');
            const convert = core.getInput('convert');
            const convertPrefixStr = core.getInput('convert_prefix');
            const overrideStr = core.getInput('override');
            const convertPrefix = convertPrefixStr.length
                ? convertPrefixStr === 'true'
                : true;
            const override = overrideStr.length ? overrideStr === 'true' : true;
            const noFile = !file.length;
            const noEnv = noEnvInput.length ? noEnvInput === 'true' : false;
            const convertFunc = convertTypes[convert];
            let secrets;
            try {
                secrets = JSON.parse(secretsJson);
            }
            catch (e) {
                throw new Error(`Cannot parse JSON secrets.
Make sure you add the following to this action:

with:
      secrets: \${{ toJSON(secrets) }}
`);
            }
            let includeList = null;
            if (includeListStr.length) {
                includeList = includeListStr.split(',').map(key => key.trim());
            }
            if (excludeListStr.length) {
                excludeList = excludeList.concat(excludeListStr.split(',').map(key => key.trim()));
            }
            let envFileContent = '';
            core.debug(`Using include list: ${includeList === null || includeList === void 0 ? void 0 : includeList.join(', ')}`);
            core.debug(`Using exclude list: ${excludeList.join(', ')}`);
            for (const key of Object.keys(secrets)) {
                if (includeList && !includeList.some(inc => key.match(new RegExp(inc)))) {
                    continue;
                }
                if (excludeList.some(inc => key.match(new RegExp(inc)))) {
                    continue;
                }
                let newKey = keyPrefix.length ? `${keyPrefix}${key}` : key;
                if (convert.length) {
                    if (!convertFunc) {
                        throw new Error(`Unknown convert value "${convert}". Available: ${Object.keys(convertTypes).join(', ')}`);
                    }
                    if (!convertPrefix) {
                        newKey = `${keyPrefix}${convertFunc(newKey.replace(keyPrefix, ''))}`;
                    }
                    else {
                        newKey = convertFunc(newKey);
                    }
                }
                const value = secrets[key].replace(/\n/g, '\\n');
                envFileContent += `${newKey}=${value}\n`;
                if (noEnv) {
                    continue;
                }
                if (process.env[newKey]) {
                    if (override) {
                        core.warning(`Will re-write "${newKey}" environment variable.`);
                    }
                    else {
                        core.info(`Skip overwriting secret ${newKey}`);
                        continue;
                    }
                }
                core.exportVariable(newKey, secrets[key]);
                core.info(`Exported secret ${newKey}, length: ${value.length}`);
            }
            if (!noFile) {
                core.info(`Writing to file: ${file}`);
                (0, fs_1.writeFile)(file, envFileContent, err => {
                    if (err)
                        throw err;
                });
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
if (require.main === module) {
    run();
}
