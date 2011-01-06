/*
   The Q Code is just a code like urlencode, but its safe for the
   window.localtion.hash encode. I choosed the q out of the fact it
   is the 17 letter in the alphapet. So it possible to encode hex with
   A-P's. And the letter q is not used as much in the written languages.

   Use it and feel free, i never done any performance test
 */
Q = (function() {
  var valid_keys = (function() {
    var _valid_keys = []
    var whitelist = [{start:' ', end:'~'}]
    for(var j = whitelist.length-1; j >= 0; --j) {
      var e = whitelist[j]
      for(var i = e.start.charCodeAt(0); i <= e.end.charCodeAt(0); ++i) {
        _valid_keys[i] = String.fromCharCode(i)
      }
    }
    // add exception
    _valid_keys[("~").charCodeAt(0)] = null // 8Bit Encoder
    _valid_keys[(" ").charCodeAt(0)] = null // 8Bit Encoder
    _valid_keys[("q").charCodeAt(0)] = null // 8Bit Encoder
    _valid_keys[("Q").charCodeAt(0)] = null // 16Bit Encoder
    return _valid_keys;
  })();
  count_map = (function() {
    var cm = []
    var types = { 
                  0: 9,  /* \t */
                  1: 10, /* \r */
                  2: 13, /* \n */
                  3: 32, /* SPC */
                  4: 63  /* ?   */
                }
    var decoded = {};
    var bases = '0AaLl';
    for(var i = bases.length-1; i>= 0; --i) {
        decoded[bases[i]] = [String.fromCharCode(types[i])] 
    }
    for(var i = 0; i < 10; ++i) {
      for(var j = 0; j < 5; ++j) {
        var base = bases.charCodeAt(j)+i
        cm[base] = { 
                      value: i+1, 
                      encode:  '~'+String.fromCharCode(base),
                      decode:  decoded[bases[j]].join(''),
                      type:  types[j]
                   }
        decoded[bases[j]].push(decoded[bases[j]][0])
      }
    }
    return cm;
  })();
  var num_init = {
               9:  '~0',
               10: '~A',
               13: '~a',
               32: '~L',
               63: '~?'
             };
  var radix = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']
  var q_encode = function(num, out, idx) {
    // 113 = "q".charCodeAt(0)
    // 81  = "Q".charCodeAt(0)
    if (num_init[num]) { 
      var tmp = out[idx-1] 
      if (tmp && 
          tmp.length == 2 && 
          tmp.charCodeAt(0) == 126) {
        var count = tmp.charCodeAt(1)
        var tmp = count_map[count]
        if (tmp.type == num && tmp.value < 10) {
//console.log(idx, count, JSON.stringify(tmp), JSON.stringify(count_map[count+1]))
           out[idx-1] = count_map[count+1].encode;    
           return idx;
        } 
      } 
      out[idx++] = num_init[num]; 
      return idx;
    } 

    if (num == 113) { out[idx++] = "qq"; return idx; }
    if (num == 81)  { out[idx++] = "QQ"; return idx; }
    if (num == 126)  { out[idx++] = "~~"; return idx; } /* _ */
    if (num < 0x100) { 
      out[idx++] = "q" + radix[(num>>4)&0xf] + radix[(num>>0)&0xf]; return idx;
    }
    out[idx++] = "Q" + radix[(num>>12)&0xf] + radix[(num>>8)&0xf] + radix[(num>>4)&0xf] + radix[(num>>0)&0xf]
    return idx;
  }
  var base = ("A").charCodeAt(0);
  var q_decode = function(str) {
    var qq = str.substr(0,2)
    if (qq == 'qq') { return { decoded: 'q', len: 2 } }
    if (qq == 'QQ') { return { decoded: 'Q', len: 2 } }
    if (qq == '~~') { return { decoded: '~', len: 2 } }
    var mode = qq.substr(0,1)
    if (mode == '~')  { 
      return { decoded: count_map[qq.charCodeAt(1)].decode, len: 2 } 
    }
    str = str.toUpperCase() // work save with the base
    if (mode == 'Q') {
      return { decoded: String.fromCharCode(((str.charCodeAt(1)-base)<<12)|((str.charCodeAt(2)-base)<<8)|
                                            ((str.charCodeAt(3)-base)<<4) |((str.charCodeAt(4)-base)<<0)), len: 5 }
    } 
    if (mode == 'q') {
      return { decoded: String.fromCharCode(((str.charCodeAt(1)-base)<<4)|(str.charCodeAt(2)-base)), len: 3 }
    }
    return { decoded: str, len: str.length }
  }

  return {
    encode: function(str) {
      var out = ['!']
      var len = str.length
      var valid = valid_keys
      var idx = 1
      for(var i = 0; i < len; ++i) {
        var c = str.substr(i,1)
        var num = c.charCodeAt(0)
        if (valid[num]) {
          out[idx++] = c
        } else {
          idx = q_encode(num, out, idx)
        }
      }
      return out.join('')
    },
    decode: function(hash) {
      if(hash.match(/%22/)) { // heuristic for URL encoded JSON
        hash = decodeURIComponent(hash);
      }
      if (hash.substr(0,1) != '!') {
        //console.log('throw "Illegal Q-Code:"+hash')
        throw "Illegal Q-Code:"+hash
      }
      var len = hash.length
      var idx = 0
      var oidx = 0
      var out = []
      var valid = valid_keys
      for(var i = '!'.length; i < len; ++i) {
        var c = hash.substr(i,1) 
        if (!valid[c.charCodeAt(0)]) {
          var ret = q_decode(hash.substr(i,5))
          out.push(ret.decoded)
          i += ret.len - 1// q/Q read before
        } else {
          out.push(c)
        }
      }
      return out.join('')
    }
  }
})()
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
var fs = require('fs');
fs.readFile('test.html', function(r, data) {
  data = data.toString('UTF-8');
  var enc = Q.encode(data);
  fs.writeFile('test.enc', enc, 'UTF-8')
  var dec = Q.decode(enc);
  fs.writeFile('test.dec', dec, 'UTF-8')
  if (data != dec) {
    console.log(dec);
  }
});
*/

