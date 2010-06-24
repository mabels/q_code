/*
   The Q Code is just a code like urlencode, but its safe for the
   window.localtion.hash encode. I choosed the q out of the fact it
   is the 17 letter in the alphapet. So it possible to encode hex with
   A-P's. And the letter q is not used as much in the written languages.

   Use it and feel free, i never done any performance test
 */
Q = {
  valid_keys: function() {
    if (!this._valid_keys) {
      this._valid_keys = []
      var whitelist = [{start:'0', end:'9'},
                       {start:'A', end:'Z'},
                       {start:'a', end:'z'}]
      for(var j = whitelist.length-1; j >= 0; --j) {
        var e = whitelist[j]
        for(var i = e.start.charCodeAt(0); i <= e.end.charCodeAt(0); ++i) {
          this._valid_keys[i] = String.fromCharCode(i)
        }
      }
      var exceptions = ['.',',']
      for(var j = exceptions.length-1; j >= 0; --j) {
        this._valid_keys[exceptions[j].charCodeAt(0)] = exceptions[j]
      }
      // add exception
      this._valid_keys[("q").charCodeAt(0)] = null
      this._valid_keys[("Q").charCodeAt(0)] = null
    }
    return this._valid_keys
  },

  q_encode: function(num) {
    // 113 = "q".charCodeAt(0)
    // 81  = "Q".charCodeAt(0)
    if (num == 113) { return "qq" }
    if (num == 81)  { return "QQ" }
    var radix = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']
    if (num < 0x100) { return "q" + radix[(num>>4)&0xf] + radix[(num>>0)&0xf] }
    return "Q" + radix[(num>>12)&0xf] + radix[(num>>8)&0xf] + radix[(num>>4)&0xf] + radix[(num>>0)&0xf]
  },

  encode: function(str) {
    var out = []
    var len = str.length
    var valid = this.valid_keys()
    for(var i = 0; i < len; ++i) {
      var c = str.substr(i,1)
      var num = c.charCodeAt(0)
      if (valid[num]) {
        out.push(c)
      } else {
        out.push(this.q_encode(num))
      }
    }
    return out.join('')
  },

  q_decode: function(str) {
    var qq = str.substr(0,2)
    if (qq == 'QQ') { return { decoded: 'Q', len: 2 } }
    if (qq == 'qq') { return { decoded: 'q', len: 2 } }
    var mode = str.substr(0,1)
    var base = ("A").charCodeAt(0)
    str = str.toUpperCase() // work save with the base
    if (mode == 'Q') {
      return { decoded: String.fromCharCode(((str.charCodeAt(1)-base)<<12)|((str.charCodeAt(2)-base)<<8)|
                                            ((str.charCodeAt(3)-base)<<4) |((str.charCodeAt(2)-base)<<0)), len: 5 }
    } 
    if (mode == 'q') {
      return { decoded: String.fromCharCode(((str.charCodeAt(1)-base)<<4)|(str.charCodeAt(2)-base)), len: 3 }
    }
  },
  decode: function(hash) {
    var len = hash.length
    var idx = 0
    var oidx = 0
    var out = []
    for(var i = 0; i < len; ++i) {
      var c = hash.substr(i,1) 
      if (c == 'Q' || c == 'q') {
        var ret = this.q_decode(hash.substr(i,5))
        out.push(ret.decoded)
        i += ret.len - 1// q/Q read before
      } else {
        out.push(c)
      }
    }
    return out.join('')
  }
}
if (typeof(exports) != 'undefined') { exports = Q }

function Qexport() { return Q; } // exports for Demandware

/*
base = 'ÄmenoqgiesbertQabelsÜ%'
//base = 'ÄmenoÖabelsÜ'
encode = Q.encode(base)
decode = Q.decode(encode)
print(base)
print(encode)
print(decode)
*/
