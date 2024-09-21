const EventEmitter = require('bare-events')

class Stream extends EventEmitter {
  constructor({ readable, writable }) {
    super()

    this.readable = readable || false
    this.writable = writable || false

    this._connections = 0
  }

  pipe(dest, opts = {}) {
    const source = this

    // data flow
    source.on('data', ondata)

    dest.on('drain', ondrain)
    dest.on('pause', onpause)
    dest.on('resume', onresume)

    function ondata(chunk) {
      if (dest.writable && dest.write(chunk) === false) {
        source.pause()
      }
    }

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
    let ending = false

    if (opts.end !== false) {
      dest._connections++

      source.on('end', onend)
      source.on('close', onclose)
    }

    function onend() {
      if (ending) return

      ending = true
      dest._connections--
      cleanup()

      if (dest._connections === 0) dest.end()
    }

    function onclose() {
      if (ending) return

      ending = true
      dest._connections--
      cleanup()

      if (dest._connections === 0) dest.destroy()
    }

    // error handling
    source.on('error', onerror)
    dest.on('error', onerror)

    function onerror(err) {
      cleanup()

      if (this.listenerCount('error') === 0) throw err
    }

    function cleanup() {
      source.off('data', ondata)
      dest.off('drain', ondrain)

      dest.off('pause', onpause)
      dest.off('resume', onresume)

      source.off('error', onerror)
      dest.off('error', onerror)

      source.off('end', onend)
      source.off('close', onclose)
    }
  }

  pause() {
    if (this.readable) this.emit('pause')
  }

  resume() {
    if (this.readable) this.emit('resume')
  }
}

module.exports = Stream
