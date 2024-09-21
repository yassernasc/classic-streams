const test = require('brittle')
const Stream = require('.')

test('it flows', function (t) {
  const a = new Stream()
  const b = new Stream()
  const c = new Stream()

  a.pipe(b)
    .pipe(c)
    .on('data', data => t.is(data, 'vasco'))

  a.emit('data', 'vasco')
})
