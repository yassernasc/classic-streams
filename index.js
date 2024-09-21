const EventEmitter = require('bare-events')

class Stream extends EventEmitter {
  constructor({ readable, writable } = {}) {
    super()

    this.readable = readable ?? true
    this.writable = writable ?? true

    this._connections = 0
    this._paused = false
    this._ended = false
    this._buffer = []
  }

  write(data) {
    if (!this.writable || this._ended) return

    this._buffer.push(data)
    this.drain()

    return !this._paused
  }

  drain() {
    while (this._buffer.length && !this.paused) {
      this.emit('data', this._buffer.shift())
    }
  }

  pause() {
    if (this._paused) return

    this._paused = true
    this.emit('pause')
  }

  resume() {
    if (!this._paused) return

    this._paused = false
    this.emit('resume')
  }

  end() {
    if (this._ended) return

    this._ended = true
    this.emit('end')
  }

  pipe(dest) {
    const source = this

    // data flow
    source.on('data', ondata)

    function ondata(chunk) {
      if (dest.writable && dest.write(chunk) === false) {
        source.pause()
      }
    }

    dest.on('drain', ondrain)
    dest.on('pause', onpause)
    dest.on('resume', onresume)

    function ondrain() {
      source.resume()
    }

    function onresume() {
      source.resume()
    }

    function onpause() {
      source.pause()
    }

    // closure
    dest._connections++

    source.on('end', onend)

    function onend() {
      cleanup()

      dest._connections--
      if (dest._connections === 0) dest.end()
    }

    // error handling and teardown
    source.on('error', onerror)
    dest.on('error', onerror)

    function onerror(err) {
      cleanup()

      if (this.listenerCount('error') === 0) throw err
    }

    function cleanup() {
      source.off('data', ondata)
      source.off('end', onend)

      dest.off('pause', onpause)
      dest.off('resume', onresume)
      dest.off('drain', ondrain)

      source.off('error', onerror)
      dest.off('error', onerror)
    }

    return dest
  }
}

module.exports = Stream
