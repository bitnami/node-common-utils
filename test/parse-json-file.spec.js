'use strict';

const Sandbox = require('nami-test').Sandbox;
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));

const parseJSONFile = require('../index.js').parseJSONFile;

/* eslint-disable no-unused-expressions */

describe('#parseJSONFile()', () => {
  let s = null;

  beforeEach(() => {
    s = new Sandbox();
  });

  afterEach(() => {
    s.cleanup();
  });

  it('parses well-formed JSON file', () => {
    const content = [{somecontent: 1, something: '2'}];
    s.createFilesFromManifest({
      file: JSON.stringify(content)
    });
    expect(parseJSONFile(s.normalize('file'))).to.be.eql(content);
  });

  it('parses JSON file and validates it against a schema', () => {
    const content = {somecontent: 1, something: '2'};
    s.createFilesFromManifest({
      file: JSON.stringify(content)
    });
    const schema = {
      id: 'test',
      type: 'object',
      properties: {
        somecontent: {type: 'integer'},
        something: {type: 'string'}
      }
    };
    s.createFilesFromManifest({
      schema: JSON.stringify(schema)
    });
    expect(parseJSONFile(s.normalize('file'), {schemaFile: s.normalize('schema')})).to.be.eql(content);
  });

  it('throws error on malformed JSON file', () => {
    s.createFilesFromManifest({
      file: '[{"something"}]'
    });
    expect(() => parseJSONFile(s.normalize('file'))).to.throw('Failed to parse file');
  });

  it('parses JSON file and throws an error if it is not valid given a schema', () => {
    const content = {somecontent: 1};
    s.createFilesFromManifest({
      file: JSON.stringify(content)
    });
    const schema = {
      id: 'test',
      type: 'object',
      properties: {
        somecontent: {type: 'string'}
      }
    };
    s.createFilesFromManifest({
      schema: JSON.stringify(schema)
    });
    expect(() => parseJSONFile(s.normalize('file'), {schemaFile: s.normalize('schema')}))
      .to.throw('Invalid JSON for the schema test:\ninstance.somecontent is not of a type(s) string');
  });
});
