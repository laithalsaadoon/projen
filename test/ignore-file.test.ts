import { IgnoreFile } from '../src';
import { synthSnapshot, TestProject } from './util';

test('ignorefile synthesizes correctly', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  new IgnoreFile(prj, '.dockerignore');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([]);
});

test('ignorefile includes file after exclusion and inclusion', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  const file = new IgnoreFile(prj, '.dockerignore');
  file.exclude('a.txt');
  file.include('a.txt');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([
    '!a.txt',
  ]);
});

test('ignorefile excludes file after inclusion and exclusion', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  const file = new IgnoreFile(prj, '.dockerignore');
  file.include('a.txt');
  file.exclude('a.txt');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([
    'a.txt',
  ]);
});

test('ignorefile omits duplicated includes and excludes', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  const file = new IgnoreFile(prj, '.dockerignore');
  file.exclude('a.txt', 'b.txt');
  file.include('c.txt', 'd.txt');
  file.exclude('a.txt', 'b.txt');
  file.include('c.txt', 'd.txt');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([
    'a.txt',
    'b.txt',
    '!c.txt',
    '!d.txt',
  ]);
});

test('if include() is called with "!", then strip it', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.include('!*.js');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    '!*.js',
  ]);
});

test('removePatters() can be used to remove previously added patters', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.addPatterns('*.js');
  ignore.addPatterns('my_file');
  ignore.addPatterns('!boom/bam');
  ignore.removePatterns('*.zz', '*.js', '!boom/bam');
  ignore.addPatterns('*.zz');
  ignore.addPatterns('boom/bam');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    'my_file',
    '*.zz',
    'boom/bam',
  ]);
});

test('comments are filtered out', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.addPatterns('*.js', '#comment');
  ignore.addPatterns('!foo');
  ignore.addPatterns('# hello world');
  ignore.addPatterns('bar');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    '*.js',
    '!foo',
    'bar',
  ]);
});

test('included directories are removed when a parent directory is excluded', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.addPatterns('src/hello.txt', 'src/greetings/world.txt');
  ignore.addPatterns('src/__tests__');
  ignore.addPatterns('bloop/', '!floop/');
  ignore.addPatterns('!src/');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    'bloop/',
    '!floop/',
    '!src/',
  ]);
});

test('excluded directories are removed when a parent directory is included', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.addPatterns('!src/hello.txt', '!src/greetings/world.txt');
  ignore.addPatterns('!src/__tests__');
  ignore.addPatterns('bloop/', '!floop/');
  ignore.addPatterns('src/');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    'bloop/',
    '!floop/',
    'src/',
  ]);
});

// parses file contents without 'Generated by...' spiel
function splitAndIgnoreMarker(fileContents: string) {
  const lines = fileContents.split('\n');
  return lines.slice(1, lines.length - 1);
}