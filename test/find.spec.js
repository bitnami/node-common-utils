'use strict';

const _ = require('lodash');
const Sandbox = require('nami-test').Sandbox;
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));

const find = require('../index.js').find;

/* eslint-disable no-unused-expressions */

describe('#find()', () => {
  let s = null;

  beforeEach(() => {
    s = new Sandbox();
  });

  afterEach(() => {
    s.cleanup();
  });

  it('finds a directory in a folder', () => {
    s.createFilesFromManifest({
      folder1: {
        folder2: {
          folder3: {}
        }
      }
    });
    expect(find(s.normalize('folder1'), 'folder3')).to.be.eql(s.normalize('folder1/folder2/folder3'));
    expect(find(s.normalize('folder1'), 'folder3', {findAll: true}),
          'expected just one result even with the findAll option enabled').to.be
      .eql([s.normalize('folder1/folder2/folder3')]);
  });

  it('finds a directory in several folders', () => {
    s.createFilesFromManifest({
      folder1: {
        folder2: {
          folder3: {}
        }
      },
      folder2: {
        folder3: {}
      }
    });
    expect(find(_.map(['folder1', 'folder2'], f => s.normalize(f)), 'folder3', {findAll: true})).to.be
      .eql(_.map(['folder1/folder2/folder3', 'folder2/folder3'], f => s.normalize(f)));
  });

  it('finds several ocurrences in a folder', () => {
    s.createFilesFromManifest({
      folder1: {
        folder2: {
          folder3: {}
        },
        folder4: {
          folder3: {}
        }
      }
    });
    expect(find(s.normalize('folder1'), 'folder3', {findAll: true})).to.be
      .eql(_.map(['folder1/folder2/folder3', 'folder1/folder4/folder3'], f => s.normalize(f)));
  });

  it('finds several ocurrenes in several folders', () => {
    s.createFilesFromManifest({
      folder1: {
        folder2: {
          folder3: {}
        },
        folder4: {
          folder3: {}
        }
      },
      folder2: {
        folder2: {
          folder3: {}
        },
        folder3: {}
      }
    });
    expect(find(_.map(['folder1', 'folder2'], f => s.normalize(f)), 'folder3', {findAll: true})).to.be
      .eql(_.map(['folder1/folder2/folder3', 'folder1/folder4/folder3', 'folder2/folder2/folder3', 'folder2/folder3'],
           f => s.normalize(f)));
  });

  it('finds directories matching an expression', () => {
    s.createFilesFromManifest({
      folder1: {
        folder2: {
          folder30: {},
          folder31: {}
        }
      }
    });
    expect(find(s.normalize('folder1'), /folder3./, {findAll: true})).to.be
    .eql(_.map(['folder1/folder2/folder30', 'folder1/folder2/folder31'],
         f => s.normalize(f)));
  });

  it('finds directories using maxDepth', () => {
    s.createFilesFromManifest({
      folder1: {
        folder2: {
          folder3: {}
        },
        folder3: {}
      }
    });
    expect(find(s.normalize('folder1'), 'folder3', {maxDepth: 1, findAll: true})).to.be
    .eql([s.normalize('folder1/folder3')]);
  });

  it('throws an error if no directory is found using maxDepth', () => {
    s.createFilesFromManifest({
      folder1: {
        folder2: {
          folder3: {}
        }
      }
    });
    expect(() => {
      find(s.normalize('folder1'), 'folder3', {maxDepth: 1, findAll: true});
    }).to.throw('Cannot find anything matching "folder3"');
  });

  it('throws error if directory not found', () => {
    s.createFilesFromManifest({
      folder1: {}
    });
    expect(() => find(s.normalize('folder1'), 'folder3')).to.throw('Cannot find anything matching "folder3".');
  });

  describe('cache file', () => {
    it('finds a directory in the cache file', () => {
      s.createFilesFromManifest({
        cache: '/tmp/test/folder1/file\n/tmp/test/anotherfile\ns3://mybucket/user/file\n'
      });
      expect(find('/whatever', 'file', {cacheFile: s.normalize('cache')})).to.be.eql('/tmp/test/folder1/file');
    });

    it('finds several directories in the cache file', () => {
      s.createFilesFromManifest({
        cache: '/tmp/test/folder1/file\n/tmp/test/anotherfile\n/tmp/test/home/user/file\n'
      });
      expect(find('/whatever', 'file', {cacheFile: s.normalize('cache'), findAll: true})).to.be
        .eql(['/tmp/test/folder1/file', '/tmp/test/home/user/file']);
    });

    it('finds directories outside the cache file if not found inside', () => {
      s.createFilesFromManifest({
        cache: '/tmp/test/folder1/smtg\n/tmp/test/anotherfile\n/tmp/test/home/user/smtg\n',
        folder1: {file: ''}
      });
      expect(find(s.normalize('folder1'), 'file', {cacheFile: s.normalize('cache')})).to.be
        .eql(s.normalize('folder1/file'));
    });

    it('finds directories inside and outside the cache file if findAll is true', () => {
      s.createFilesFromManifest({
        cache: '/tmp/test/folder1/file\n/tmp/test/anotherfile\n/tmp/test/home/user/file\n',
        folder1: {file: ''}
      });
      expect(find(s.normalize('folder1'), 'file', {cacheFile: s.normalize('cache'), findAll: true})).to.be
        .eql(['/tmp/test/folder1/file', '/tmp/test/home/user/file', s.normalize('folder1/file')]);
    });
  });
});
