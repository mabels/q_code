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
      var whitelist = [{start:' ', end:'~'}]
      for(var j = whitelist.length-1; j >= 0; --j) {
        var e = whitelist[j]
        for(var i = e.start.charCodeAt(0); i <= e.end.charCodeAt(0); ++i) {
          this._valid_keys[i] = String.fromCharCode(i)
        }
      }
      // add exception
      this._valid_keys[("+").charCodeAt(0)] = null // 8Bit Encoder
      this._valid_keys[(" ").charCodeAt(0)] = null // 8Bit Encoder
      this._valid_keys[("?").charCodeAt(0)] = null // 8Bit Encoder
      this._valid_keys[("X").charCodeAt(0)] = null // 8Bit Encoder
      this._valid_keys[("q").charCodeAt(0)] = null // 8Bit Encoder
      this._valid_keys[("Q").charCodeAt(0)] = null // 16Bit Encoder
print("valid_keys:"+this._valid_keys.length)
    }
    return this._valid_keys
  },

  q_encode: function(num) {
    // 113 = "q".charCodeAt(0)
    // 81  = "Q".charCodeAt(0)
    if (num == 32) { return "+" }
    if (num == 88) { return "XX" }
    if (num == 63) { return "X" }
    if (num == 113) { return "qq" }
    if (num == 81)  { return "QQ" }
    if (num == 43)  { return "++" }
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
print("XXXX-1:"+str)
    if (qq == 'XX') { return { decoded: 'X', len: 2 } }
    if (qq == 'QQ') { return { decoded: 'Q', len: 2 } }
    if (qq == 'qq') { return { decoded: 'q', len: 2 } }
    if (qq == '++') { return { decoded: '+', len: 2 } }
    var mode = qq.substr(0,1)
    if (mode == '+')  { return { decoded: ' ', len: 1 } }
    str = str.toUpperCase() // work save with the base
print("XXXX-2:"+mode)
    if (mode == 'Q') {
      return { decoded: String.fromCharCode(((str.charCodeAt(1)-this.base)<<12)|((str.charCodeAt(2)-this.base)<<8)|
                                            ((str.charCodeAt(3)-this.base)<<4) |((str.charCodeAt(4)-this.base)<<0)), len: 5 }
    } 
    if (mode == 'q') {
      return { decoded: String.fromCharCode(((str.charCodeAt(1)-this.base)<<4)|(str.charCodeAt(2)-this.base)), len: 3 }
    }
  },
  decode: function(hash) {
    var len = hash.length
    var idx = 0
    var oidx = 0
    var out = []
    var valid = this.valid_keys()
    this.base = ("A").charCodeAt(0)
    for(var i = 0; i < len; ++i) {
      var c = hash.substr(i,1) 
      if (!valid[c.charCodeAt(0)]) {
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
//base = 'ÄmenoqgiesbertQabelsÜ%'
base = '{ÄmenoqgiesbertQabelsÜ%:"meno", meno: { all: "meno" }}'
//base = 'ÄmenoÖabelsÜ'
encode = Q.encode(base)
decode = Q.decode(encode)
print(base)
print(encode)
print(decode)
*/
