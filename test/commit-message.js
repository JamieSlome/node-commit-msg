'use strict';

var assert = require('assert');
var util = require('util');
var path = require('path');
var CommitMessage = require('..');
var Error = require('../lib/error');

var cfg = CommitMessage.prototype.config;
var cases = [
    {
        describe: 'simple message',
        raw: 'Test commit\n',
        in: ['Test commit'],
        errors: []
    },
    {
        describe: 'special characters',
        in: ['Test, (commit): with-\'special\' `characters.a`'],
        errors: []
    },
    {
        describe: 'title and body',
        in: ['Test commit with body',
        'This is a commit body to explain the changes.'],
        errors: []
    },
    {
        describe: 'title and lengthy body',
        in: ['Test commit with lengthy body',
        'This is the first paragraph\n' +
        'of the body. More paragraphs following.' +
        '\n\n' +
        'Some bullets here:' +
        '\n\n' +
        ' - bullet point 1\n' +
        ' - bullet point 2' +
        '\n\n' +
        ' - bullet point 3'],
        errors: []
    },
    {
        describe: 'semver (tag) commit',
        in: ['v1.0.0-alpha'],
        errors: []
    },
    {
        describe: 'empty commit',
        in: [''],
        errors: [new Error('Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message',
        Error.ERROR)]
    },
    {
        describe: 'invalid format',
        in: ['\nCommit message starting with newline'],
        errors: [new Error('Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message',
        Error.ERROR)]
    },
    {
        describe: 'invalid format',
        in: ['Correct summary',
        '\nBody starting with newline'],
        errors: [new Error('Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message',
        Error.ERROR)]
    },
    {
        describe: 'starting with a lowercase letter',
        in: ['commit message with lowercase first letter'],
        errors: [new Error('Commit message should start with a capitalized letter',
        Error.ERROR, [1, 1])]
    },
    {
        describe: 'ending with a period',
        in: ['Commit message ending with a period.'],
        errors: [new Error('First line (summary) should not end with a period or whitespace',
        Error.ERROR, [1, 36])]
    },
    {
        describe: 'ending with whitespace',
        in: ['Commit message ending with a period '],
        errors: [new Error('First line (summary) should not end with a period or whitespace',
        Error.ERROR, [1, 36])]
    },
    {
        describe: 'invalid characters',
        in: ['Commit message with <invalid> chars'],
        errors: [new Error('First line (summary) contains invalid characters',
        Error.ERROR, [1, 21])]
    },
    {
        describe: 'long body lines',
        in: ['Correct first line',
'Commit body with very long lines that exceed the 72 characters limit imposed\n' +
'by git commit message best practices. These practices include the linux kernel\n' +
'and the git source.'],
        errors: [new Error(util.format('Lines 1, 2 in the commit body are ' +
        'longer than %d characters. Body lines should ' +
        'not exceed %d characters, except for compiler error ' +
        'messages or other "non-prose" explanation',
        cfg.bodyMaxLineLength[0], cfg.bodyMaxLineLength[0]),
        Error.WARNING, [3, cfg.bodyMaxLineLength[0]])]
    },
    {
        describe: 'invalid whitespace (space)',
        in: ['Commit  with 2 consecutive spaces'],
        errors: [new Error('First line (summary) contains invalid whitespace',
        Error.ERROR, [1, 7])]
    },
    {
        describe: 'invalid whitespace (tab)',
        in: ['Commit with\ttab'],
        errors: [new Error('First line (summary) contains invalid characters',
        Error.ERROR, [1, 12])]
    },
    {
        describe: 'no imperative present tense',
        in: ['Changes profile picture delete feature'],
        errors: [new Error('Detected \'Changes\' instead of \'Change\', use ' +
        'only imperative present tense', Error.WARNING)],
        skip: true
    }
];

describe('CommitMessage', function() {

    describe('#parse()', function() {

        cases.forEach(function(t) {
            var input = t.raw || t.in.join('\n\n');
            var message = CommitMessage.parse(input);
            var failMsg = 'Message was:\n' + input;
            var errNo = t.errors.length;
            var itFn = t.skip ? it.skip : it;
            var expectErrors = !t.errors.every(function(e) { return !e.is(Error.ERROR); });

            describe(t.describe, function() {

                itFn(util.format('should have %d error(s)', errNo), function() {
                    assert.deepEqual(message._errors, t.errors, failMsg);
                });

                if (!message.hasErrors() && !expectErrors) {
                    itFn('should have the correct title', function() {
                        assert.equal(message._title, t.in[0], failMsg);
                    });

                    itFn('should have the correct body', function() {
                        assert.equal(message._body, t.in[1], failMsg);
                    });

                    itFn('should validate imperative present tense');
                    itFn('should identify github issues correctly');
                }

            });
        }); // end forEach

    }); // end #parse()

    describe('#parseFromFile', function() {
        describe('valid file', function() {
            var file = path.resolve(__dirname, 'resources/COMMIT_EDITMSG');
            var message = CommitMessage.parseFromFile(file);
            var failMsg = 'Message read from ' + path.relative(
                path.resolve(__dirname, '..'), file
            );

            it('should have 0 errors', function() {
                assert.deepEqual(message._errors, [], failMsg);
            });

            it('should have the correct title', function() {
                assert.equal(message._title,
                    'Fix broken crypto_register_instance() module');
            });
        });
    });

}); // end CommitMessage
