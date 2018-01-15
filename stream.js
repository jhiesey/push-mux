
function isError (end) {
  return end && end !== true
}

module.exports = DuplexStream

function DuplexStream () {
  this.paused = false
  this.buffer = []
}

//the following functions look really generic,
//bet they could be shifted into push-stream module

// subclasses should overwrite this method
DuplexStream.prototype.write = function (data) {
  throw new Error('subclasses should overwrite Stream.write')
}

// subclasses should overwrite this method
DuplexStream.prototype.end = function (err) {
  throw new Error('subclasses should overwrite Stream.end')
}

DuplexStream.prototype._preread = function () {}

DuplexStream.prototype._write = function (data) {
  if(this.sink && !this.sink.paused) {
    this._preread(data)
    this.sink.write(data)
    //for duplex streams, should it pause like this?
    //i'm thinking no, because input does not necessarily
    //translate into output, so output can pause, without causing
    //input to pause.

    // this.paused = this.sink.paused
  }
  else {
    this.buffer.push(data)
  }
}

DuplexStream.prototype._end = function (end) {
  this.ended = end || true
  if(this.sink) {
    //if err is an Error, push the err,
    if(isError(end))
      this.sink.end(end)
    //otherwise, respect pause
    else if(!this.sink.paused) {
      this.sink.end(end)
      this.paused = this.sink.paused
    }
  }
}

DuplexStream.prototype.resume = function () {
  if(!(this.buffer.length) && !this.ended || !this.sink) return
  if(isError(this.ended))
    return this.sink.end(this.ended)

  while(this.buffer.length && !this.sink.paused) {
    var data = this.buffer.shift()
    this._preread(data)
    this.sink.write(data)
  }

  if(this.ended && this.buffer.length == 0 && !this.sink.paused)
    this.sink.end(this.ended)
}

DuplexStream.prototype.pipe = require('push-stream/pipe')

