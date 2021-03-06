'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const nos = require('nami-utils').os;
const nfile = require('nami-utils').file;
const jsonlint = require('jsonlint');
const Validator = require('jsonschema').Validator;

/**
 * @namespace commonUtils
 */

function _noop() {}


function _getDummyLogger() {
  const logger = {};
  _.each(['info', 'error', 'trace', 'warn',
  'trace1', 'trace2', 'trace3', 'trace4', 'trace5', 'trace6', 'trace7', 'trace8'], level => logger[level] = _noop);
  return logger;
}


function _match(text, searchTerm) {
  if (_.isString(searchTerm)) {
    if (text === searchTerm || nfile.matches(text, searchTerm)) {
      return true;
    }
  } else {
    if (text.match(searchTerm)) {
      return true;
    }
  }
  return false;
}


function _objectToNatural(obj) {
  let msg = '';
  _.each(obj, (v, k) => msg += `${k}="${v}" `);
  return msg;
}


/**
 * Executes a command logging it's arguments and environment variables
 * @memberof commonUtils
 * @param {string} cmd - command to execute
 * @param {string|string[]} [args] - arguments of the command
 * @param {Object} [options]
 * @param {Object} [options.logger=null] - Logger to use
 * @param {boolean} [options.runInBackground=false] - Run the command in the background
 * @param {boolean} [options.retrieveStdStreams=false] - Returns a hash describing the process stdout, stderr and
 * exit code.
 * @param {string} [options.runAs=null] - User used to run the program as. Only when running as admin.
 * @param {boolean} [options.ignoreStdStreams=false] - Completely ignore standard streams
 * @param {boolean} [options.detachStdStreams=false] - Save standard streams to temporary files while executing
 * the program (solves some processes hanging because of unclosed streams)
 * @param {string} [options.stdoutFile=null] - File used to store program stdout when running in background
 * when detaching streams
 * @param {string} [options.stdoutFileMode='a+'] - Flags used to open the stdoutFile
 * @param {string} [options.stderrFile=null] - File used to store program stderr when running in background
 * when detaching streams
 * @param {string} [options.stderrFileMode='a+'] - Flags used to open the stderrFile
 * @param {string} [options.cwd] - Working directory
 * @param {Object} [options.env={}] - Object containing extra environment variables to be made accesible to the running
 * process
 * @param {string} [options.input=null] - Value passed as stdin to the spawned process
 * @returns {string|Object} - String with the output of the command or object with stdout, stderr and exit code if
 * {@linkcode options.ignoreStdStreams} is true.
 * @throws {Error} - If command is not found or it returns exit code != 0
 */
function logExec(cmd, args, options) {
  if (_.isUndefined(options) && _.isPlainObject(args)) {
    options = args;
    args = [];
  }
  options = _.defaults(options || {}, {
    logger: null, runInBackground: false, retrieveStdStreams: false, detachStdStreams: false,
    stdoutFile: null, stderrFile: null, stdoutFileMode: 'a+', stderrFileMode: 'a+', env: {}
  });

  const logger = options.logger || _getDummyLogger();
  const envVars = options.env;
  let message = `Executing command: "${cmd}"`;

  if (!_.isEmpty(args)) {
    if (_.isArray(args) && args.length > 1) {
      message += ` ${_.map(args, arg => `"${arg}"`).join(' ')}`;
    } else {
      message += ` "${_.isArray(args) ? args[0] : args}"`;
    }
  }

  logger.info(message);

  if (!_.isEmpty(envVars)) {
    logger.trace(`ENVIRONMENT VARIABLES:\n${_objectToNatural(_.omitBy(envVars, _.isEmpty))}`);
  }

  // Run the command mutting its output to avoid duplicity
  return nos.runProgram(cmd, args, _.assign(_.cloneDeep(options), {logger: _getDummyLogger()}));
}


/**
 * Find files in directories
 * @param  {string|string[]} directories - List of directories where to look for files
 * @param  {string|regexp} searchTerm - Term to find in directories
 * @param  {Object} [options]
 * @param  {boolean} [options.findAll=false] - Search for all the ocurrences.
 * @param  {string} [options.cacheFile=null] - Apart from the directories, search inside a file with paths (one
 * line per path).
 * @param  {number} [options.maxDepth=null] - Maximum depth of the search
 * @return {array|string} - Path of the item found or an array of them if {@linkcode options.findAll} is true
 * @throws {Error} - If no item found
 */
function find(directories, searchTerm, options) {
  options = _.defaults(options || {}, {cacheFile: null, findAll: false, maxDepth: Infinity});
  directories = _.flatten([directories]);
  const occurences = [];
  if (_.isString(options.cacheFile) && nfile.exists(options.cacheFile)) {
    nfile.eachLine(options.cacheFile, function(line) {
      if (_match(nfile.basename(line), searchTerm)) {
        occurences.push(line);
        // Returning false will make 'eachLine' stop
        if (!options.findAll) return false;
      }
    });
  }

  if (_.isEmpty(occurences) || options.findAll) {
    _.each(directories, function(dir) {
      nfile.walkDir(dir, (f) => {
        if (_match(nfile.basename(f), searchTerm)) {
          occurences.push(f);
          // Returning false will make 'walkDir' stop
          if (!options.findAll) return false;
        }
      }, {maxDepth: options.maxDepth});
      // Returning false will make 'each' stop
      if (!_.isEmpty(occurences) && !options.findAll) return false;
    });
  }

  if (_.isEmpty(occurences)) throw new Error(`Cannot find anything matching "${searchTerm}".`);

  return options.findAll ? occurences : occurences[0];
}


/**
 * Get the list of directories in a directory.
 * @param  {string} srcPath - Directory where to look in
 * @param  {Object} [options]
 * @param  {boolean} [options.srcPath=true] - Return full paths instead of the directory names
 * @return {string[]} - List of directories
 */
function listDirectories(srcPath, options) {
  options = _.defaults(options || {}, {fullPath: true});
  const list = fs.readdirSync(srcPath);
  const directories = [];
  _.each(list, e => {
    const ePath = path.join(srcPath, e);
    if (nfile.isDirectory(ePath)) {
      directories.push(options.fullPath ? path.normalize(ePath) : e);
    }
  });
  return directories;
}

/**
 * Validates an Object against a JSON schema
 * @param  {Object} subject - Subject to validate
 * @param  {Object} schema - JSON Schema to validate against
 * @throws {Error} - If the subject doesn't satisfies the schema
 */
function validate(object, schema) {
  const v = new Validator();
  v.addSchema(schema, schema.id);
  const validationResult = v.validate(object, schema);
  if (!_.isEmpty(validationResult.errors)) {
    throw new Error(
      `Invalid JSON for the schema ${schema.id}:\n` +
      `${_.map(validationResult.errors, e => `${e.stack}`).join('\n')}`
    );
  }
}

function _parseJSONFile(file) {
  try {
    return jsonlint.parse(nfile.read(file));
  } catch (e) {
    throw new Error(`Failed to parse file: ${file}. ${e.message}`);
  }
}

/**
 * Read and validate JSON file
 * @param  {string} file - JSON file to read
 * @return {Object} - Object with parsed content of file
 * @param  {Object} [options]
 * @param  {string} [options.schemaFile] - Path to a JSON schema to validate the result
 * @throws {Error} - If JSON file is not valid
 */
function parseJSONFile(file, options) {
  options = _.defaults({}, options, {
    schemaFile: null
  });
  const parsedObject = _parseJSONFile(file);
  if (options.schemaFile) {
    validate(parsedObject, _parseJSONFile(options.schemaFile));
  }
  return parsedObject;
}


module.exports = {
  logExec,
  find,
  listDirectories,
  parseJSONFile,
  validate,
};
