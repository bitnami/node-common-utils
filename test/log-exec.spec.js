'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));

const logExec = require('../index.js').logExec;

class Logger {
  constructor(level) {
    level = level || 'trace';
    this._levels = ['error', 'warn', 'info', 'debug', 'trace', 'trace1', 'trace2', 'trace3', 'trace4', 'trace5',
    'trace6', 'trace7', 'trace8'];
    this.buffer = [];
    _.each(this._levels.slice(0, this._levels.indexOf(level) + 1),
    l => this[l] = (msg) => this.buffer.push({level: l, message: msg}));
    _.each(this._levels.slice(this._levels.indexOf(level) + 1, this._levels.length),
    l => this[l] = () => {});
  }
}

/* eslint-disable no-unused-expressions */

describe('#logExec()', () => {
  let logger = null;

  beforeEach(() => {
    logger = new Logger();
  });

  afterEach(() => {
    logger = null;
  });

  it('doesn\'t log not provided arguments', () => {
    logExec('true', {logger});
    expect(logger.buffer[0]).to.be
      .eql({level: 'info', message: 'Executing command: "true"'});
  });

  it('logs provided argument (one)', () => {
    logExec('true', '-l', {logger});
    expect(logger.buffer[0]).to.be
      .eql({level: 'info', message: 'Executing command: "true" with a single argument: "-l"'});
  });

  it('logs provided arguments (several)', () => {
    logExec('true', ['-l', 'h'], {logger});
    expect(logger.buffer[0]).to.be
      .eql({level: 'info', message: 'Executing command: "true" with arguments: ["-l","h"]'});
  });

  it('doesn\'t log not provided environment variables', () => {
    logExec('true', {logger});
    expect(logger.buffer[1].message).to.not.startsWith('ENVIRONMENT VARIABLES');
  });

  it('logs provided environment variables', () => {
    const env = {var1: 'someContent'};
    logExec('true', {logger, env});
    expect(logger.buffer[1].message).to.be.eql('ENVIRONMENT VARIABLES:\nvar1=someContent\n');
  });

  it('returns the output of the command', () => {
    const output = logExec('echo', ['test'], {logger});
    expect(output).to.be.eql('test\n');
  });
});
