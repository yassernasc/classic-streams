const test = require('brittle')
const Stream = require('.')

function noop() {}

test('it flows', function (t) {
  const a = new Stream()
  const b = new Stream()
  const c = new Stream()

  a.pipe(b)
    .pipe(c)
    .on('data', data => t.is(data, 'vasco'))

  a.emit('data', 'vasco')
})

test('error handling', function (t) {
  new Stream().on('error', noop).emit('error', new Error('boom!'))

  t.pass('the error handling prevents the explosion')
})
