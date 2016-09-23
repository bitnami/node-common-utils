'use strict';

const _ = require('lodash');
const Sandbox = require('nami-test').Sandbox;
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));

const listDirectories = require('../index.js').listDirectories;

/* eslint-disable no-unused-expressions */

describe('#listDirectories()', () => {
  let s = null;

  beforeEach(() => {
    s = new Sandbox();
  });

  afterEach(() => {
    s.cleanup();
  });

  it('lists directories in an empty folder', () => {
    s.createFilesFromManifest({
      folder1: {
        file: ''
      }
    });
    expect(listDirectories(s.normalize('folder1'))).to.be.eql([]);
  });

  it('lists directories in a directory', () => {
    s.createFilesFromManifest({
      folder1: {
        file: '',
        folder2: {},
        folder3: {file: ''},
        folder4: {
          folder5: {}
        }
      }
    });
    expect(listDirectories(s.normalize('folder1'))).to.be
      .eql(_.map(['folder2', 'folder3', 'folder4'], d => s.normalize(`folder1/${d}`)));
  });

  it('lists directories in a directory with just basename', () => {
    s.createFilesFromManifest({
      folder1: {
        file: '',
        folder2: {},
        folder3: {file: ''},
        folder4: {
          folder5: {}
        }
      }
    });
    expect(listDirectories(s.normalize('folder1'), {fullPath: false})).to.be
      .eql(['folder2', 'folder3', 'folder4']);
  });
});
